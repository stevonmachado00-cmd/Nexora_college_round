workflows = nexusModules.workflows;
billing = nexusModules.billing;
names.workflows = 'Workflow security';
const originalModuleAction = action;
action = function (name) {
  const details = {
    'security-approval': ['Campaign send approval', '<p><strong>Proposed action:</strong> Send the webinar follow-up to 246 opted-in attendees.</p><p><strong>Requested by:</strong> Nexus AI · <strong>Target:</strong> Webinar attendee audience</p><p><strong>Policy:</strong> Consent and suppression checks must pass; owner approval is required before delivery.</p><p>This is an illustrative review. No message will be sent.</p>'],
    'security-publish': ['Website publication approval', '<p><strong>Proposed action:</strong> Publish the webinar registration page.</p><p><strong>Impact:</strong> Public website change · <strong>Reviewer:</strong> Workspace owner</p><p>This is an illustrative review. No page will be published.</p>'],
    'security-billing': ['Subscription change approval', '<p><strong>Proposed action:</strong> Move Orbit from Pro to Business.</p><p><strong>Impact:</strong> Customer financial obligation may change.</p><p>Billing actions require an exact action preview, owner approval, and an audit record. This demo does not change a subscription.</p>'],
    'billing-subscription': ['Subscription details', '<p><strong>Lifecycle:</strong> Customer → subscription → invoice → entitlement.</p><p>Review the plan, renewal, trial or grace period, and CRM relationship before a change.</p><p>Sample record · No customer or payment data is updated.</p>'],
    'billing-plan': ['Plan details', '<p>Plan prices, limits, recurring interval, and website pricing bindings are illustrated here.</p><p>Changing a live plan or subscription would require review and approval.</p>']
  };
  if (details[name]) return modal(details[name][0], details[name][1]);
  return originalModuleAction(name);
};
renderContent();
