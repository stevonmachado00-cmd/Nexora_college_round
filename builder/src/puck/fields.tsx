import type { Field } from "@puckeditor/core";
import { useEffect, useState } from "react";
import { ImageUrl, SafeUrl } from "../../shared/schema";
type Definition = {
  type?: string;
  enum?: unknown[];
  properties?: Record<string, Definition>;
  items?: Definition;
  default?: unknown;
  maxItems?: number;
  minItems?: number;
};
const label = (name: string) =>
  name.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase());
export function schemaFields(input: unknown): Record<string, Field> {
  const schema = input as Definition;
  return Object.fromEntries(
    Object.entries(schema.properties || {})
      .filter(([name]) => name !== "id")
      .map(([name, definition]) => [name, toField(name, definition)]),
  );
}
function toField(name: string, schema: Definition): Field {
  const base = { label: label(name) };
  if (/Color$/.test(name) || /url$/i.test(name) || name === "image") {
    const kind = /Color$/.test(name)
      ? "color"
      : name === "image"
        ? "image"
        : "url";
    return {
      ...base,
      type: "custom",
      render: ({ value, onChange }) => (
        <SafeValueField
          value={String(value || "")}
          onChange={onChange}
          label={base.label}
          kind={kind}
        />
      ),
    };
  }
  if (schema.enum)
    return {
      ...base,
      type: "select",
      options: schema.enum.map((value) => ({
        label: String(value).replaceAll("-", " "),
        value: value as string,
      })),
    };
  if (schema.type === "boolean")
    return {
      ...base,
      type: "radio",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    };
  if (schema.type === "object")
    return { ...base, type: "object", objectFields: schemaFields(schema) };
  if (schema.type === "array") {
    // Puck's array field represents objects. A custom field handles short lists of plain strings.
    if (schema.items?.type === "string")
      return {
        ...base,
        type: "custom",
        render: ({ value, onChange }) => (
          <StringList
            value={value as string[]}
            onChange={onChange}
            label={base.label}
            max={schema.maxItems || 12}
          />
        ),
      };
    const fields = schemaFields(schema.items || {});
    const defaultItem =
      (Array.isArray(schema.default) ? schema.default[0] : null) ||
      Object.fromEntries(
        Object.entries(schema.items?.properties || {}).map(([key, value]) => [
          key,
          value.default ??
            (value.type === "boolean"
              ? false
              : value.type === "array"
                ? []
                : ""),
        ]),
      );
    return {
      ...base,
      type: "array",
      arrayFields: fields,
      defaultItemProps: defaultItem,
      getItemSummary: (item, index) =>
        String(
          item.title ||
            item.name ||
            item.question ||
            item.label ||
            `Item ${(index || 0) + 1}`,
        ),
      max: schema.maxItems,
      min: schema.minItems,
    };
  }
  return {
    ...base,
    type: /description|quote|answer|headline/.test(name) ? "textarea" : "text",
  };
}
function SafeValueField({
  value,
  onChange,
  label,
  kind,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  kind: "color" | "image" | "url";
}) {
  const [draft, setDraft] = useState(value),
    [error, setError] = useState("");
  useEffect(() => {
    setDraft(value);
    setError("");
  }, [value]);
  function update(next: string) {
    setDraft(next);
    const valid =
      kind === "color"
        ? /^#[0-9a-fA-F]{6}$/.test(next)
        : (kind === "image" ? ImageUrl : SafeUrl).safeParse(next).success;
    if (valid) {
      setError("");
      onChange(next);
    } else
      setError(
        kind === "color"
          ? "Enter a six-digit hex color. The last valid color is still applied."
          : "Enter a safe HTTP(S), relative, or anchor URL. The last valid URL is still applied.",
      );
  }
  return (
    <div className="safe-value-field">
      <label>
        {label}
        <div>
          {kind === "color" && (
            <input
              aria-label={`${label} picker`}
              type="color"
              value={value}
              onChange={(e) => update(e.target.value)}
            />
          )}
          <input
            aria-label={label}
            value={draft}
            onChange={(e) => update(e.target.value)}
            aria-invalid={!!error}
          />
        </div>
      </label>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
function StringList({
  value = [],
  onChange,
  label,
  max,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  max: number;
}) {
  return (
    <div className="string-list">
      <label>
        {label}
        <textarea
          value={value.join("\n")}
          onChange={(event) =>
            onChange(event.target.value.split("\n").slice(0, max))
          }
        />
      </label>
      <small>One entry per line. up to {max}</small>
    </div>
  );
}
