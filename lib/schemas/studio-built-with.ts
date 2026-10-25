import { z } from "zod";
import { studioToolsSchema } from "./studio-tools";

export const projectToolsSchema = studioToolsSchema.extend({ gas: z.boolean().optional() });
export const toolUsageSchema = z.object({
  tool: z.string().min(1),
  values: z.array(z.string()).optional(),
  status: z.enum(["used", "configured", "declared_not_found", "not_used"]),
  evidence: z.array(z.string()).optional(),
});
export const projectSummarySchema = z.object({
  title: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  pages: z.array(z.object({ path: z.string(), purpose: z.string() })),
  toolsUsed: z.array(z.object({ tool: z.string().min(1), values: z.array(z.string()).optional() })),
  lastChange: z.string(),
  updatedAt: z.iso.datetime({ offset: true }).optional(),
  jobId: z.string().optional(),
  tools: z.array(toolUsageSchema).optional(),
});
export const toolCatalogSchema = z.object({ tools: z.record(z.string(), z.object({
  type: z.string(),
  label: z.string().min(1),
  fallback: z.string().optional(),
  options: z.array(z.object({ id: z.string(), label: z.string(), status: z.string().optional() })).optional(),
})) });
export const builtWithResponseSchema = z.object({
  summary: projectSummarySchema.nullable(),
  selection: projectToolsSchema,
  catalog: toolCatalogSchema,
});
export type BuiltWithData = z.infer<typeof builtWithResponseSchema>;
export type UsageStatus = z.infer<typeof toolUsageSchema>["status"] | "reported";

function selectionValues(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "boolean") return [value ? "Enabled" : "Disabled"];
  return typeof value === "string" ? [value] : [];
}

export function builtWithTools({ summary, selection, catalog }: BuiltWithData) {
  const tools = new Map<string, { tool: string; values?: string[]; status: UsageStatus; evidence?: string[] }>();
  // Code-level usage takes precedence over the AI's own toolsUsed declaration.
  for (const usage of summary?.tools ?? []) tools.set(usage.tool, usage);
  for (const usage of summary?.toolsUsed ?? []) {
    if (!tools.has(usage.tool)) tools.set(usage.tool, { ...usage, status: "reported" });
  }
  for (const [tool, value] of Object.entries(selection)) {
    if (value !== undefined && !tools.has(tool)) tools.set(tool, { tool, values: selectionValues(value), status: "configured" });
  }
  return [...tools.values()].map(usage => {
    const entry = catalog.tools[usage.tool];
    const configured = selection[usage.tool as keyof typeof selection];
    const values = usage.values ?? selectionValues(configured);
    // An explicitly empty payment selection means XLM only; never use catalog defaults.
    const hasValues = usage.values !== undefined || configured !== undefined;
    const effectiveValues = hasValues && values.length === 0 && entry?.fallback ? [entry.fallback] : values;
    return {
      ...usage,
      label: entry?.label ?? (usage.tool === "ramps" ? "Fiat ramps" : usage.tool.replace(/[_-]/g, " ")),
      values: effectiveValues.map(value => ({ id: value, label: entry?.options?.find(option => option.id === value)?.label ?? value })),
      evidence: usage.evidence ?? [],
    };
  });
}
