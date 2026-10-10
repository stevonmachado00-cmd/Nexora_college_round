// Illustrative, internally consistent data for the UI concept only.
const analyticsSample = {
  period: 'October 2026',
  visitors: 24892,
  leads: 1284,
  engaged: 846,
  registered: 328,
  attended: 246,
  subscribed: 89,
  mrr: 24680,
  attributedRevenue: 18420,
  channels: [
    { name: 'Organic search', visitors: 10455, leads: 594 },
    { name: 'Direct traffic', visitors: 6970, leads: 301 },
    { name: 'Email campaigns', visitors: 4730, leads: 256 },
    { name: 'Social & referral', visitors: 2737, leads: 133 }
  ],
  campaigns: [
    { name: 'October product update', audience: 'Customers', recipients: 892, openRate: '46.2%', conversions: 24, status: 'Sent' },
    { name: 'Welcome to Acme', audience: 'New website leads', recipients: 1240, openRate: '58.4%', conversions: 42, status: 'Active' },
    { name: 'Growth Masterclass invitation', audience: 'Engaged leads', recipients: 846, openRate: '38.1%', conversions: 23, status: 'Sent' }
  ],
  agent: { runs: 42, completed: 38, failed: 4, approvalsRequested: 36, approvalsGranted: 30, averageLatency: '2m 14s', costPerCompletedRun: '$0.48' }
};

const analyticsNumber = value => value.toLocaleString('en-US');
const analyticsPercent = (part, total) => `${(part / total * 100).toFixed(1)}%`;

function analyticsMetric(label, value, note, module) {
  return `<div class="card analytics-metric"><div class="analytics-metric-label">${label}</div><strong>${value}</strong><small>${note}</small>${module ? `<button class="link" data-page="${module}">View ${module === 'crm' ? 'CRM' : module} →</button>` : ''}</div>`;
}

function analyticsSectionTitle(title, description, module, linkText) {
  return `<div class="analytics-section-title"><div><h2>${title}</h2><p>${description}</p></div>${module ? `<button class="link" data-page="${module}">${linkText} →</button>` : ''}</div>`;
}

function analytics() {
  const d = analyticsSample;
  const steps = [
    ['Visitors', d.visitors, 'website'], ['Leads', d.leads, 'crm'],
    ['Engaged', d.engaged, 'campaigns'], ['Registered', d.registered, 'webinars'],
    ['Attended', d.attended, 'webinars'], ['Subscribed', d.subscribed, 'billing']
  ];
  const channelRows = d.channels.map(channel => `<div class="analytics-channel"><div class="analytics-channel-head"><strong>${channel.name}</strong><span>${analyticsNumber(channel.visitors)} visitors · ${analyticsNumber(channel.leads)} leads</span></div><div class="analytics-track"><i style="width:${channel.visitors / d.visitors * 100}%"></i></div><small>${analyticsPercent(channel.leads, channel.visitors)} visitor-to-lead</small></div>`).join('');
  const campaignRows = d.campaigns.map(campaign => `<tr><td><strong>${campaign.name}</strong><small>${campaign.audience}</small></td><td>${analyticsNumber(campaign.recipients)}</td><td>${campaign.openRate}</td><td>${campaign.conversions}</td><td>${badge(campaign.status, campaign.status === 'Active' ? 'green' : 'purple')}</td></tr>`).join('');

  return head('Integrated analytics', 'Follow the journey from first visit to subscription, with campaign and agent outcomes in one view.', `<span class="analytics-period">▦ &nbsp; ${d.period}</span>${badge('Illustrative data', 'purple')}`) +
    `<div class="analytics-intro"><span class="spark">▥</span><div><strong>One connected customer journey</strong><p>These sample figures show how Nexus links website, CRM, campaigns, webinars, billing, and agent activity. No live business data is connected.</p></div></div>` +
    `<div class="analytics-kpis">` +
      analyticsMetric('Visitor → lead', analyticsPercent(d.leads, d.visitors), `${analyticsNumber(d.leads)} of ${analyticsNumber(d.visitors)} visitors`, 'website') +
      analyticsMetric('Lead → subscriber', analyticsPercent(d.subscribed, d.leads), `${d.subscribed} of ${analyticsNumber(d.leads)} leads`, 'crm') +
      analyticsMetric('Webinar attendance', analyticsPercent(d.attended, d.registered), `${d.attended} of ${d.registered} registrants`, 'webinars') +
      analyticsMetric('Monthly recurring revenue', `$${analyticsNumber(d.mrr)}`, 'Sample active subscription revenue', 'billing') +
    `</div>` +
    `<section class="card analytics-block" aria-label="Customer lifecycle">` +
      analyticsSectionTitle('Customer lifecycle', 'See where people move forward and where the journey narrows.', 'crm', 'Open CRM') +
      `<div class="analytics-funnel">${steps.map(([label, count, module], index) => `<button class="analytics-funnel-step" data-page="${module}" aria-label="${label}: ${analyticsNumber(count)}, ${index ? analyticsPercent(count, steps[index - 1][1]) + ' of previous stage' : 'starting stage'}"><span>${label}</span><strong>${analyticsNumber(count)}</strong><div class="analytics-track"><i style="width:${index ? count / steps[index - 1][1] * 100 : 100}%"></i></div><small>${index ? `${analyticsPercent(count, steps[index - 1][1])} from ${steps[index - 1][0].toLowerCase()}` : 'Starting audience'}</small></button>`).join('')}</div>` +
      `<p class="analytics-note">Stage counts illustrate the shared lifecycle. Each conversion rate uses the immediately preceding stage as its denominator.</p>` +
    `</section>` +
    `<div class="analytics-grid">` +
      `<section class="card analytics-block" aria-label="Acquisition channels">${analyticsSectionTitle('Acquisition channels', 'Website traffic and lead capture by source.', 'website', 'Open websites')}<div class="analytics-channel-list">${channelRows}</div></section>` +
      `<section class="card analytics-block" aria-label="Webinar performance">${analyticsSectionTitle('Webinar performance', 'Registration, attendance, and the next step.', 'webinars', 'Open webinars')}<div class="analytics-webinar"><div><span>Registered</span><strong>${d.registered}</strong></div><div><span>Attended</span><strong>${d.attended}</strong></div><div><span>Subscribed</span><strong>${d.subscribed}</strong></div></div><div class="analytics-detail"><strong>${analyticsPercent(d.attended, d.registered)}</strong><span>attendance rate</span><strong>${analyticsPercent(d.subscribed, d.attended)}</strong><span>attendee-to-subscription rate</span></div><p class="analytics-note">Sample journey: registration page → CRM contact → attendance → follow-up → subscription.</p></section>` +
    `</div>` +
    `<section class="card analytics-block" aria-label="Campaign performance">${analyticsSectionTitle('Campaign performance', 'Audience engagement and conversions from the same CRM records.', 'campaigns', 'Open campaigns')}<div class="table-wrap"><table class="table analytics-table"><thead><tr><th>CAMPAIGN</th><th>RECIPIENTS</th><th>OPEN RATE</th><th>CONVERSIONS</th><th>STATUS</th></tr></thead><tbody>${campaignRows}</tbody></table></div><p class="analytics-note">The campaign rows are examples. Conversion totals can overlap with the lifecycle journey, so they are not added to its stages.</p></section>` +
    `<div class="analytics-grid">` +
      `<section class="card analytics-block" aria-label="Subscription and revenue">${analyticsSectionTitle('Subscription and revenue', 'Connect customer conversion to recurring revenue.', 'billing', 'Open billing')}<div class="analytics-revenue"><div><span>Monthly recurring revenue</span><strong>$${analyticsNumber(d.mrr)}</strong></div><div><span>Annual run rate</span><strong>$${analyticsNumber(d.mrr * 12)}</strong></div><div><span>Revenue attributed</span><strong>$${analyticsNumber(d.attributedRevenue)}</strong></div><div><span>Subscription churn</span><strong>—</strong><small>No cancellation sample</small></div></div><p class="analytics-note">Annual run rate is current sample MRR × 12, not collected revenue. Attribution is illustrative; no attribution model or cancellation events are connected.</p></section>` +
      `<section class="card analytics-block" aria-label="AI workflow outcomes">${analyticsSectionTitle('AI workflow outcomes', 'Track completion, approvals, speed, and cost.', 'workflows', 'Open workflows')}<div class="analytics-agent-grid"><div><span>Completed runs</span><strong>${d.agent.completed} / ${d.agent.runs}</strong><small>${analyticsPercent(d.agent.completed, d.agent.runs)} success rate</small></div><div><span>Approvals granted</span><strong>${d.agent.approvalsGranted} / ${d.agent.approvalsRequested}</strong><small>${analyticsPercent(d.agent.approvalsGranted, d.agent.approvalsRequested)} approval rate</small></div><div><span>Average latency</span><strong>${d.agent.averageLatency}</strong><small>Per workflow run</small></div><div><span>Cost per completion</span><strong>${d.agent.costPerCompletedRun}</strong><small>Illustrative model/tool cost</small></div></div><p class="analytics-note">${d.agent.failed} runs failed. Approvals are shown as review checkpoints; this concept executes no AI tools.</p></section>` +
    `</div>` +
    `<div class="analytics-footer">Sample workspace · All analytics are illustrative and use no live tracking, payments, campaign delivery, or AI execution.</div>`;
}

