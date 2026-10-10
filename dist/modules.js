// Nexus module overviews match the current local implementation.
const nexusModules = (() => {
  const panel = (title, detail, body) => `<section class="card module-panel"><div class="card-head"><div><h2>${title}</h2><p>${detail}</p></div></div>${body}</section>`;
  const tabs = labels => `<div class="tabs">${labels.map(label => `<button class="tab ${(tab || labels[0]) === label ? 'selected' : ''}" data-tab="${label}">${label}</button>`).join('')}</div>`;
  const list = items => `<div class="module-list">${items.map(([title, detail]) => `<p><strong>${title}</strong><br>${detail}</p>`).join('')}</div>`;
  const summary = items => `<div class="module-summary">${items.map(([label, value, note]) => `<div class="card"><small>${label}</small><strong>${value}</strong><span>${note}</span></div>`).join('')}</div>`;
  const plans = [
    ['Starter', '₹1,999', '3', '1', '1,000', '2,000', '1', '100'],
    ['Growth', '₹5,999', '10', '3', '10,000', '15,000', '5', '750'],
    ['Scale', '₹14,999', '25', '10', '50,000', '60,000', '20', '2,500']
  ];
  function workflows() {
    return head('Workflow security', 'Plan a workflow with Gemini, review the draft, and inspect saved activity.', '') +
      `<section class="card workflow-hero"><div><span class="workflow-eyebrow">WORKFLOW PLANNER</span><h2>From business goal to a clear draft.</h2><p>Describe what you want to achieve. Gemini proposes steps for you to review. The planner does not execute actions.</p><a class="btn primary" href="/console.html">Draft a workflow →</a></div><div class="workflow-hero-art" aria-hidden="true"><span>01 <b>Describe</b></span><i></i><span>02 <b>Draft</b></span><i></i><span>03 <b>Review</b></span></div></section>` +
      `<div class="workflow-card-grid"><section class="card workflow-simple-card"><span>01 / ACCESS</span><h3>One signed-in account</h3><p>The local demo account can access the planner and audit trail.</p></section><section class="card workflow-simple-card"><span>02 / BOUNDARY</span><h3>Drafts stay drafts</h3><p>Gemini cannot send, publish, approve, or charge.</p></section><section class="card workflow-simple-card"><span>03 / TRACE</span><h3>Saved activity</h3><p>Review actual actions and provider events in the audit trail.</p></section></div>` +
      `<p class="workflow-footnote">Current local scope: workflow drafting and saved audit activity. Automated execution and approval queues are not available.</p>`;
  }
  function billing() {
    const selected = tab || 'Plans';
    let body = '';
    if (selected === 'Plans') body = `<form id="nexus-billing-checkout"><div class="sites-grid billing-plan-grid">${plans.map(([name, price, team, sites, contacts, emails, webinars, credits]) => `<label class="card plan-card billing-plan-choice"><input type="radio" name="plan_id" value="${name.toLowerCase()}" required><div class="module-plan-top"><h2>${name}</h2><span class="pill purple">Monthly</span></div><div class="plan-price">${price}<small> / month</small></div><p>Final price · 18% GST included</p>${list([['Team members', team], ['Websites', sites], ['CRM contacts', contacts], ['Campaign emails / month', emails], ['Webinars / month', webinars], ['AI credits / month', credits]])}<span class="billing-select-label">Select ${name}</span></label>`).join('')}</div><div class="billing-checkout-bar"><div><strong id="billing-selection">Select a plan to continue</strong><span>Razorpay Test Mode · UPI AutoPay appears when enabled by Razorpay</span></div><button class="btn primary" id="billing-checkout-button" disabled>Continue to Razorpay →</button></div><p id="billing-message" class="billing-message" role="status"></p></form>`;
    if (selected === 'Subscriptions') body = `<div class="module-two">${panel('Buy and manage', 'Direct actions in Razorpay Test Mode.', list([
      ['Buy', 'Choose a plan and open checkout. The full first month is charged up front.'],
      ['Upgrade', 'An upgrade is requested immediately.'],
      ['Downgrade', 'A downgrade is scheduled for the end of the billing cycle.'],
      ['Cancel', 'Cancellation is immediate. Remaining paid time is forfeited without a refund.']
    ]))}${panel('Payment lifecycle', 'Provider status is reflected through signed webhook events.', list([
      ['Recurring billing', 'Monthly cycles begin 30 days after checkout.'],
      ['Failed payment', 'A five-day grace deadline is recorded. Automatic suspension is not yet implemented.'],
      ['Local testing', 'Checkout uses Razorpay Test Mode; no live charge is made.']
    ]))}</div>`;
    if (selected === 'Usage & invoices') body = `<div class="module-two">${panel('Usage allowances', 'Per-plan monthly amounts are shown under Plans.', list([
      ['AI drafts', 'Five agent drafts count as one AI credit.'],
      ['Reset', 'Counters are intended to reset on the customer billing date, without rollover.'],
      ['Current implementation', 'Usage events can be recorded and viewed. Cross-module limit blocking is not yet enforced.'],
      ['Overages', 'No overage charges or usage billing.']
    ]))}${panel('Invoices', 'Actual saved records appear in the working console.', '<p>Razorpay payment and invoice events update local billing records after a verified webhook is received.</p><a class="btn primary" href="/console.html">View invoices →</a>')}</div>`;
    return head('Billing', 'Choose a monthly plan and continue directly to Razorpay Test Mode checkout.') + summary([
      ['Starter', '₹1,999', 'per month · GST included'],
      ['Growth', '₹5,999', 'per month · GST included'],
      ['Scale', '₹14,999', 'per month · GST included'],
      ['Checkout', 'Test Mode', 'Direct subscription purchase']
    ]) + tabs(['Plans', 'Subscriptions', 'Usage & invoices']) + body;
  }
  return { workflows, billing };
})();

document.addEventListener('change', event => {
  if (!event.target.matches('#nexus-billing-checkout input[name="plan_id"]')) return;
  const form = event.target.form;
  const plan = event.target.closest('.billing-plan-choice');
  form.querySelectorAll('.billing-plan-choice').forEach(card => card.classList.toggle('selected', card === plan));
  form.querySelector('#billing-selection').textContent = `${plan.querySelector('h2').textContent} · ${plan.querySelector('.plan-price').textContent.trim()}`;
  form.querySelector('#billing-checkout-button').disabled = false;
  form.querySelector('#billing-message').textContent = '';
});

document.addEventListener('submit', async event => {
  if (event.target.id !== 'nexus-billing-checkout') return;
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('#billing-checkout-button');
  const message = form.querySelector('#billing-message');
  const planId = new FormData(form).get('plan_id');
  if (!planId) return;
  button.disabled = true;
  button.textContent = 'Connecting to Razorpay…';
  message.textContent = '';
  try {
    const response = await fetch('/api/public/subscriptions/checkout', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({plan_id:planId})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to start Razorpay checkout');
    location.href = data.url;
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
    button.textContent = 'Continue to Razorpay →';
  }
});
