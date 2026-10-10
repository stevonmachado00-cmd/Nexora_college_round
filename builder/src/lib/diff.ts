import type { WebsiteDocument } from "../../shared/schema";
export function summarizeChanges(
  before: WebsiteDocument,
  after: WebsiteDocument,
) {
  const lines: string[] = [];
  for (const key of Object.keys(
    after.data.root.props.theme,
  ) as (keyof typeof after.data.root.props.theme)[]) {
    if (before.data.root.props.theme[key] !== after.data.root.props.theme[key])
      lines.push(
        `Theme · ${key}: ${before.data.root.props.theme[key]} → ${after.data.root.props.theme[key]}`,
      );
  }
  if (before.data.root.props.title !== after.data.root.props.title)
    lines.push(`Website title → ${after.data.root.props.title}`);
  const oldIds = before.data.content.map((x) => x.props.id),
    newIds = after.data.content.map((x) => x.props.id);
  for (const block of after.data.content) {
    const original = before.data.content.find(
      (x) => x.props.id === block.props.id,
    );
    if (!original) {
      lines.push(
        `Add ${block.type} at position ${newIds.indexOf(block.props.id) + 1}`,
      );
      continue;
    }
    if (original.type !== block.type)
      lines.push(`Replace ${original.type} with ${block.type}`);
    for (const [key, value] of Object.entries(block.props)) {
      if (
        key !== "id" &&
        JSON.stringify(value) !==
          JSON.stringify((original.props as Record<string, unknown>)[key])
      )
        lines.push(`${block.type} · ${key} updated`);
    }
    if (oldIds.indexOf(block.props.id) !== newIds.indexOf(block.props.id))
      lines.push(
        `Move ${block.type} to position ${newIds.indexOf(block.props.id) + 1}`,
      );
  }
  for (const block of before.data.content)
    if (!newIds.includes(block.props.id)) lines.push(`Remove ${block.type}`);
  return lines.length ? lines : ["No changes proposed."];
}
