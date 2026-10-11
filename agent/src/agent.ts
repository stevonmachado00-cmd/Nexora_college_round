import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
export { NEXUS_BUSINESS_ANALYST_SYSTEM_PROMPT } from "./business-analysis-prompt.js";

export type ActionName =
  | "website.create_page_draft"
  | "marketing.create_campaign_draft"
  | "marketing.send_campaign"
  | "webinar.create_event"
  | "crm.find_or_create_leads"
  | "analytics.get_funnel_report";

export type PlannedAction = {
  id: string;
  name: ActionName;
  description: string;
  needsApproval: boolean;
};

export type ActionResult = {
  actionId: string;
  status: "completed" | "skipped";
  message: string;
};

const AgentState = Annotation.Root({
  request: Annotation<string>,
  plan: Annotation<PlannedAction[]>({ reducer: (_, next) => next, default: () => [] }),
  approvedActionIds: Annotation<string[]>({ reducer: (_, next) => next, default: () => [] }),
  results: Annotation<ActionResult[]>({ reducer: (current, next) => current.concat(next), default: () => [] }),
  status: Annotation<"planning" | "awaiting_approval" | "completed">({
    reducer: (_, next) => next,
    default: () => "planning"
  })
});

export type NexusAgentInput = {
  request: string;
  /** IDs approved by a human in the Nexus UI. Never take this from model output. */
  approvedActionIds?: string[];
};

/**
 * Temporary zero-API planner. Replace this function with an LLM that returns the
 * same validated PlannedAction[] shape when a model provider is connected.
 */
function makePlan(request: string): PlannedAction[] {
  const text = request.toLowerCase();
  const actions: PlannedAction[] = [];
  const add = (name: ActionName, description: string, needsApproval = false) =>
    actions.push({ id: `action_${actions.length + 1}`, name, description, needsApproval });

  if (text.includes("webinar")) add("webinar.create_event", "Create a webinar draft");
  if (text.includes("page") || text.includes("landing")) {
    add("website.create_page_draft", "Create a landing-page draft from an approved template");
  }
  if (text.includes("lead") || text.includes("audience") || text.includes("campaign")) {
    add("crm.find_or_create_leads", "Build a consent-aware CRM audience");
    add("marketing.create_campaign_draft", "Create campaign copy and a delivery draft");
  }
  if (text.includes("send") || text.includes("publish")) {
    add("marketing.send_campaign", "Send the customer-facing campaign", true);
  }
  if (text.includes("report") || text.includes("funnel") || text.includes("analytics")) {
    add("analytics.get_funnel_report", "Return current funnel metrics");
  }

  return actions.length ? actions : [
    { id: "action_1", name: "analytics.get_funnel_report", description: "Clarify the request with a current business summary", needsApproval: false }
  ];
}

function executeLocally(action: PlannedAction): ActionResult {
  // Replace these messages with calls to your CRM, website, marketing, etc. APIs.
  // Keep the permission check in the graph even after those integrations exist.
  return { actionId: action.id, status: "completed", message: `Completed ${action.name}: ${action.description}` };
}

const buildPlan = (state: typeof AgentState.State) => ({ plan: makePlan(state.request), status: "planning" as const });

const approvalGate = (state: typeof AgentState.State) => {
  const hasUnapprovedSensitiveAction = state.plan.some(
    (action) => action.needsApproval && !state.approvedActionIds.includes(action.id)
  );
  return { status: hasUnapprovedSensitiveAction ? "awaiting_approval" as const : "planning" as const };
};

const execute = (state: typeof AgentState.State) => {
  const results = state.plan
    .filter((action) => !action.needsApproval || state.approvedActionIds.includes(action.id))
    .map(executeLocally);
  return { results, status: "completed" as const };
};

const nextAfterApproval = (state: typeof AgentState.State) =>
  state.status === "awaiting_approval" ? END : "execute";

export const nexusBusinessAgent = new StateGraph(AgentState)
  .addNode("build_plan", buildPlan)
  .addNode("approval_gate", approvalGate)
  .addNode("execute", execute)
  .addEdge(START, "build_plan")
  .addEdge("build_plan", "approval_gate")
  .addConditionalEdges("approval_gate", nextAfterApproval, ["execute", END])
  .addEdge("execute", END)
  .compile();

export async function runBusinessAgent(input: NexusAgentInput) {
  return nexusBusinessAgent.invoke({
    request: input.request,
    approvedActionIds: input.approvedActionIds ?? []
  });
}
