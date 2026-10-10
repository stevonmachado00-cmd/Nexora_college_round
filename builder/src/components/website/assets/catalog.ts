import saasDashboard from "./saas-dashboard.svg";
import studioEditorial from "./studio-editorial.svg";
import restaurantTable from "./restaurant-table.svg";
import wellnessArch from "./wellness-arch.svg";
import commerceShelf from "./commerce-shelf.svg";
import eventStage from "./event-stage.svg";

/**
 * Curated, locally bundled artwork for starter templates. Authors can keep an
 * asset reference or replace it with an approved relative/remote image URL in
 * the editor. No third-party image host is required for a working draft.
 */
const catalog = {
  "saas-dashboard": saasDashboard,
  "studio-editorial": studioEditorial,
  "restaurant-table": restaurantTable,
  "wellness-arch": wellnessArch,
  "commerce-shelf": commerceShelf,
  "event-stage": eventStage,
} as const;

export type TemplateAsset = keyof typeof catalog;

export function imageSource(value: string) {
  if (!value.startsWith("asset:")) return value;
  return catalog[value.slice("asset:".length) as TemplateAsset] || "";
}
