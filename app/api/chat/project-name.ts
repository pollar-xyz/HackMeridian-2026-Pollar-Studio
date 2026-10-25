// Pick the creation name before the API assigns the project's slug and domain.
// This is a local heuristic; generation can refine the display name afterwards.
export function initialProjectName(prompt: string): string {
  const marker = /\b(?:called|named|name(?:d)?\s*[:=]|llamad[ao]|con\s+(?:el\s+)?nombre|nombre\s*[:=])\s*/i.exec(prompt);
  if (marker) {
    const rest = prompt.slice(marker.index + marker[0].length);
    const quoted = rest.match(/^["“‘'`]([^"”’'`\r\n]{1,80})["”’'`]/);
    if (quoted) return quoted[1].trim();
    const name = rest.split(/[\r\n.,;:!?]|\s+(?:to|for|that|with|para|que|con)\s/i)[0].trim();
    if (name && name.length <= 80) return name;
  }

  const description = prompt
    .split(/[\r\n.!?]/)[0]
    .replace(/^(?:please\s+|por\s+favor\s+)?(?:create|build|make|design|develop|crea|crear|creá|construye|diseña|desarrolla|haz)\s+/i, "")
    .replace(/^(?:me\s+)?(?:an?|the|una?|el|la)\s+/i, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim().split(/\s+/).slice(0, 6).join(" ").slice(0, 80).trim();
  return description ? description[0].toLocaleUpperCase() + description.slice(1) : "Studio project";
}
