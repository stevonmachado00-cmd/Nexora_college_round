// Nexus frontend concept: all records and decisions below are illustrative.
const nexusModules = (() => {
  const pill = (label, tone = '') => `<span class="pill ${tone}">${label}</span>`;
  const rows = (headers, items) => `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${items.map(item => `<tr>${item.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const panel = (title, subtitle, body) => `<section class="card module-panel"><div class="card-head"><div><h2>${title}</h2><p>${subtitle}</p></div></div>${body}</section>`;
  const tabs = labels => `<div class="tabs">${labels.map((label, i) => `<button class="tab ${(tab || labels[0]) === label ? 'selected' : ''}" data-tab="${label}">${label}</button>`).join('')}</div>`;
  const summary = items => `<div class="module-summary">${items.map(([label, value, note]) => `<div class="card"><small>${label}</small><strong>${value}</strong><span>${note}</span></div>`).join('')}</div>`;
  const workflowData = [
    ['Webinar to customer', 'Webinar attendance', 'CRM → Campaigns → Billing', 'Approval required', 'Owner review before campaign send'],
    ['Welcome new leads', 'Lead form submitted', 'Website → CRM → Campaigns', 'Draft only', 'Consent checked before audience use'],
    ['Subscription renewal', 'Renewal approaching', 'Billing → CRM → Campaigns', 'Approval required', 'No subscription change without review'],
    ['High-intent lead nurture', 'Lead qualified', 'CRM → Campaigns', 'Draft only', 'Suppression list applies']
  ];
  function workflows() {
    const selected = tab || 'Workflows';
    let body = '';
    if (selected === 'Workflows') body = panel('Connected workflows', 'Each run starts with a trigger and pauses at sensitive actions.', rows(['WORKFLOW', 'TRIGGER', 'MODULES', 'GATE', 'CONTROL'], workflowData.map(([name, trigger, modules, gate, control]) => [`<strong>${name}</strong>`, trigger, modules, pill(gate, gate === 'Approval required' ? 'amber' : 'purple'), control])));
    if (selected === 'Approvals') body = panel('Approval inbox', 'Action previews show the exact scope before an operator decides.', rows(['REQUEST', 'IMPACT', 'REQUESTED BY', 'STATUS', 'REVIEW'], [
      ['Send webinar follow-up', '246 opted-in attendees · external email', 'Nexus AI · Oct 10', pill('Awaiting owner', 'amber'), '<button class="link" data-action="security-approval">Review →</button>'],
      ['Publish registration page', 'Public website change', 'Website workflow · Oct 9', pill('Awaiting owner', 'amber'), '<button class="link" data-action="security-publish">Review →</button>'],
      ['Change Orbit subscription', 'Financial obligation · Pro to Business', 'Billing workflow · Oct 8', pill('Awaiting owner', 'amber'), '<button class="link" data-action="security-billing">Review →</button>']
    ]));
    if (selected === 'Permissions') body = `<div class="module-two">${panel('Scoped tool access', 'Proposed roles and allowed actions for future implementation.', rows(['ACTOR', 'READ / DRAFT', 'SENSITIVE ACTION'], [
      ['Owner', 'All workspace modules', 'May approve after review'],
      ['Marketing editor', 'CRM segments, campaign drafts', 'Cannot send or publish'],
      ['Billing manager', 'Plans, subscriptions, invoices', 'Requests financial changes'],
      ['Nexus AI', 'Authorized context and scoped draft tools', 'Cannot self-approve']
    ]))}${panel('Policy checkpoints', 'Enforced at the future tool boundary, not just in the interface.', `<div class="module-list"><p><strong>Consent and suppression</strong><br>Filter the audience before campaign execution.</p><p><strong>Exact action approval</strong><br>Bind reviewer, target, parameters, and expiry to each approval.</p><p><strong>Fail closed</strong><br>Stop when policy, approval, or audit checks cannot complete.</p><p><strong>Least privilege</strong><br>Give each actor only the tools and records needed.</p></div>`)}</div>`;
    if (selected === 'Audit log') body = panel('Workflow activity', 'Illustrative provenance for each meaningful step.', rows(['TIME', 'WORKFLOW', 'EVENT', 'ACTOR', 'RESULT'], [
      ['Oct 10 · 10:42', 'Webinar to customer', 'Audience prepared · 246 contacts', 'Nexus AI', pill('Draft', 'purple')],
      ['Oct 10 · 10:43', 'Webinar to customer', 'Approval requested for campaign send', 'Nexus AI', pill('Pending', 'amber')],
      ['Oct 9 · 16:18', 'Welcome new leads', 'Suppression check applied', 'Policy gate', pill('Passed', 'green')],
      ['Oct 8 · 13:04', 'Subscription renewal', 'Plan change paused for review', 'Billing policy', pill('Pending', 'amber')]
    ]));
    return head('Workflow security', 'Permissions, approvals, and traceable execution across Nexus.', '<a class="btn primary" href="/console.html">Open working console →</a>') + summary([['Pending approvals', '03', 'Awaiting owner review'], ['Protected workflows', '04', 'Scoped steps'], ['Policy checks', '12', 'Illustrative this week'], ['Audit events', '28', 'Illustrative this month']]) + tabs(['Workflows', 'Approvals', 'Permissions', 'Audit log']) + body + `<p class="module-disclaimer">This overview uses sample data. Open the working console for saved demo records and role-based actions.</p>`;
  }
  const subscriptions = [
    ['Sophia Chen · Orbit', 'Pro · $149/mo', pill('Active', 'green'), 'Nov 12, 2026', '<button class="link" data-action="billing-subscription">View →</button>'],
    ['Olivia Lee · Acme', 'Business · $399/mo', pill('Active', 'green'), 'Nov 14, 2026', '<button class="link" data-action="billing-subscription">View →</button>'],
    ['Amelia Kim · Mono', 'Pro · $149/mo', pill('Trialing', 'purple'), 'Nov 18, 2026', '<button class="link" data-action="billing-subscription">View →</button>'],
    ['Daniel Brooks · Forma', 'Starter · $29/mo', pill('Past due', 'amber'), 'Oct 8, 2026', '<button class="link" data-action="billing-subscription">View →</button>']
  ];
  function billing() {
    const selected = tab || 'Subscriptions';
    let body = '';
    if (selected === 'Subscriptions') body = panel('Customer subscriptions', 'Billing identities are linked to CRM customer records.', rows(['CUSTOMER', 'PLAN', 'STATUS', 'NEXT INVOICE', 'DETAIL'], subscriptions));
    if (selected === 'Plans') body = `<div class="sites-grid">${[['Starter', '$29', '1 website · 1,000 contacts', 'Flat monthly'], ['Pro', '$149', '5 websites · 10,000 contacts', 'Flat monthly'], ['Business', '$399', 'Unlimited websites · 50,000 contacts', 'Flat monthly']].map(([name, price, limits, model]) => `<div class="card plan-card"><div class="module-plan-top"><h2>${name}</h2>${pill('Sample plan', 'purple')}</div><div class="plan-price">${price}<small> / month</small></div><p>${limits}</p><p>${model} · annual option</p><p>Website pricing block: linked preview</p><button class="btn" data-action="billing-plan">View plan</button></div>`).join('')}</div>`;
    if (selected === 'Invoices') body = panel('Invoices and payments', 'Payment outcomes and invoice states are sample records.', rows(['INVOICE', 'CUSTOMER', 'AMOUNT', 'STATUS', 'DATE'], [
      ['INV-1042', 'Orbit', '$149.00', pill('Paid', 'green'), 'Oct 2, 2026'],
      ['INV-1041', 'Acme', '$399.00', pill('Paid', 'green'), 'Oct 1, 2026'],
      ['INV-1039', 'Forma', '$29.00', pill('Past due', 'amber'), 'Sep 30, 2026'],
      ['INV-1038', 'Mono', '$0.00', pill('Trial', 'purple'), 'Sep 28, 2026']
    ]));
    if (selected === 'Usage') body = `<div class="module-two">${panel('Metered usage', 'Current period · October 2026', `<div class="module-list">${[['Contacts', '1,284 / 10,000', 13], ['Email volume', '8,460 / 20,000', 42], ['Websites', '2 / 5', 40], ['AI credits', '680 / 2,000', 34]].map(([name, value, width]) => `<div><div class="module-meter"><strong>${name}</strong><span>${value}</span></div><div class="stagebar"><i style="width:${width}%"></i></div></div>`).join('')}</div>`)}${panel('Usage billing model', 'For future provider integration.', `<div class="module-list"><p><strong>Metered record</strong><br>Timestamp, customer, meter, quantity, and source event.</p><p><strong>Included allowance</strong><br>Show usage and overage before invoice finalization.</p><p><strong>Dispute trail</strong><br>Keep corrections and source event references visible.</p></div>`)}</div>`;
    if (selected === 'Revenue') body = `<div class="module-two">${panel('Revenue movement', 'Illustrative October reporting.', `<div class="module-list"><p><strong>New MRR</strong><br>$2,480</p><p><strong>Expansion MRR</strong><br>$840</p><p><strong>Contraction MRR</strong><br>$310</p><p><strong>Churned MRR</strong><br>$460</p></div>`)}${panel('Connected attribution', 'Trace revenue to the shared customer lifecycle.', `<div class="module-list"><p>Website → CRM contact → Campaign → Webinar → Subscription</p><p>Example: Orbit subscribed after a webinar follow-up.</p><p>Source and campaign influence are sample analytics.</p></div>`)}</div>`;
    return head('Billing', 'Plans, subscriptions, usage, invoices, and revenue in one view.', '<a class="btn primary" href="/console.html">Open working console →</a>') + summary([['Monthly recurring revenue', '$24,680', '+12.8% vs prior month'], ['Annual run rate', '$296,160', 'MRR × 12'], ['Active subscriptions', '892', 'Illustrative customers'], ['Past due', '03', 'Needs review']]) + tabs(['Subscriptions', 'Plans', 'Invoices', 'Usage', 'Revenue']) + body + `<p class="module-disclaimer">This overview uses sample data. Open the working console for saved demo records and Razorpay test-mode actions.</p>`;
  }
  return { workflows, billing };
})();
