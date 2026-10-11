import { runBusinessAgent } from "./agent.js";

const request = process.argv.slice(2).join(" ") ||
  "Create a webinar landing page, build a campaign for Java leads, send it, and show a funnel report.";

const result = await runBusinessAgent({ request });

console.log(JSON.stringify(result, null, 2));

if (result.status === "awaiting_approval") {
  const pending = result.plan.filter(
    (action) => action.needsApproval && !result.approvedActionIds.includes(action.id)
  );
  console.log("\nApproval required for:", pending.map((action) => action.id).join(", "));
  console.log("In Nexus, show these actions to the user. Re-run with their approved IDs through runBusinessAgent().");
}
