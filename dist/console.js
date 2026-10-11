let currentUser = null;
let state = {};
function applyTheme(theme) {
  document.body.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.style.colorScheme = document.body.dataset.theme;
}
const query = new URLSearchParams(location.search);
if (query.get('embed') === '1') document.body.classList.add('embedded');
applyTheme(query.get('theme'));
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === 'nexus-theme') applyTheme(event.data.theme);
});
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const table = (heads, rows) => rows.length ? `<div class="table-wrap"><table class="table"><thead><tr>${heads.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : NexusUI.empty({title:"No activity yet",description:"Saved billing activity will appear here.",kind:"billing",compact:true});

async function api(path, method='GET', payload) {
  const base = query.get('embed') === '1' ? '/api/billing' : '/api';
  const response = await fetch(base + path, {method, credentials:'same-origin', headers:payload ? {'Content-Type':'application/json'} : {}, body:payload ? JSON.stringify(payload) : undefined});
  const data = await response.json().catch(() => { throw new Error("Billing returned an unexpected response. Please try again."); });
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function notice(message) {
  const node = $('#notice');
  node.textContent = message;
  node.style.display = 'block';
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => node.style.display = 'none', 6000);
}

function render() {
  const plans = (state.plans || []).filter(plan => plan.razorpay_plan_id);
  const subscriptions = (state.subscriptions || []).filter(subscription => subscription.provider_subscription_id);
  const invoices = (state.invoices || []).filter(invoice => invoice.provider_invoice_id);
  const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount || 0) / 100);
  const planRows = plans.map(plan => `<tr><td><strong>${escapeHtml(plan.name)}</strong></td><td>${money(plan.amount_paise)} / month</td><td>${escapeHtml(plan.razorpay_plan_id)}</td></tr>`).join('');
  const subscriptionRows = subscriptions.map(subscription => `<tr><td>${escapeHtml(subscription.customer_email || '—')}</td><td>${escapeHtml(subscription.plan_name || subscription.plan_id)}</td><td>${escapeHtml(subscription.status)}</td><td>${escapeHtml(subscription.provider_subscription_id)}</td></tr>`).join('');
  $('#content').innerHTML = `<div class="billing-console">
    <section class="card billing-summary"><div><span class="eyebrow">Billing status</span><h2>${state.health.razorpayTestConfigured ? 'Razorpay Test Mode connected' : 'Payment provider not configured'}</h2><p>${state.health.razorpayTestConfigured ? 'Only provider-linked billing records are shown below.' : 'Add the Razorpay test credentials to the local server before creating or viewing live billing records.'}</p></div><span class="environment">Local only</span></section>
    <div class="billing-stats"><section class="card"><strong>${plans.length}</strong><span>Connected plans</span></section><section class="card"><strong>${subscriptions.length}</strong><span>Live subscriptions</span></section><section class="card"><strong>${invoices.length}</strong><span>Provider invoices</span></section></div>
    <section class="card billing-table"><div class="panel-head"><div><h2>Connected plans</h2><p>Plans linked to Razorpay Test Mode.</p></div></div>${plans.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Plan</th><th>Price</th><th>Provider id</th></tr></thead><tbody>${planRows}</tbody></table></div>` : NexusUI.empty({title:"No connected plans",description:"Provider-linked plans will appear here when billing is configured.",kind:"billing",compact:true})}</section>
    <section class="card billing-table"><div class="panel-head"><div><h2>Live subscriptions</h2><p>Only subscriptions with a payment-provider reference are included.</p></div></div>${subscriptions.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Plan</th><th>Status</th><th>Provider id</th></tr></thead><tbody>${subscriptionRows}</tbody></table></div>` : NexusUI.empty({title:"Your subscriptions will appear here",description:"Subscriptions appear after a customer completes checkout.",kind:"billing",compact:true})}</section>
  </div>`;
}

async function refresh() {
  try {
    const [me, health, audit, plans, subscriptions, invoices] = await Promise.all([api('/me'), api('/health'), api('/audit'), api('/plans'), api('/subscriptions'), api('/invoices')]);
    currentUser = me.user;
    state = {health, audit:audit.audit, plans:plans.plans, subscriptions:subscriptions.subscriptions, invoices:invoices.invoices};
    $('#login').hidden = true;
    $('#workspace').hidden = false;
    $('#identity').innerHTML = `<span>${escapeHtml(currentUser.name)}</span><button id="logout">Sign out</button>`;
    render();
  } catch (error) {
    if (error.message === 'Sign in required') {
      currentUser = null;
      $('#login').hidden = false;
      $('#workspace').hidden = true;
      $('#identity').innerHTML = '';
    } else { notice(error.message); }
  }
}

document.addEventListener('click', async event => {
  if (event.target.id !== 'logout') return;
  await api('/logout', 'POST');
  currentUser = null;
  await refresh();
});

document.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try {
    if (event.target.id === 'login-form') {
      await api('/login', 'POST', {email:data.email, password:data.password});
      await refresh();
    }
  } catch (error) {
    notice(error.message);
  }
});

refresh();
