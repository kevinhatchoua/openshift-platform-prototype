/** Minimal YAML syntax coloring for the console-style editor (Monaco-like dark theme). */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Keys before `:` (unquoted identifiers). Strings in single or double quotes.
 * Numbers and booleans get a muted accent.
 */
export function highlightYamlToHtml(yaml: string): string {
  const lines = yaml.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("#")) {
        return `<span class="ocs-console-yaml-editor__line ocs-console-yaml-editor__comment">${escapeHtml(line)}</span>`;
      }

      const indent = line.slice(0, line.length - trimmed.length);
      let rest = trimmed;
      let html = escapeHtml(indent);

      const listMatch = /^(-\s+)(.*)$/.exec(rest);
      if (listMatch) {
        html += `<span class="ocs-console-yaml-editor__punct">${escapeHtml(listMatch[1])}</span>`;
        rest = listMatch[2];
      }

      const keyMatch = /^([^\s:#][^:]*?)(\s*:\s*)(.*)$/.exec(rest);
      if (keyMatch) {
        const [, key, sep, valuePart] = keyMatch;
        html += `<span class="ocs-console-yaml-editor__key">${escapeHtml(key)}</span>`;
        html += `<span class="ocs-console-yaml-editor__punct">${escapeHtml(sep)}</span>`;
        html += highlightYamlValue(valuePart);
        return `<span class="ocs-console-yaml-editor__line">${html}</span>`;
      }

      html += escapeHtml(rest);
      return `<span class="ocs-console-yaml-editor__line">${html}</span>`;
    })
    .join("\n");
}

function highlightYamlValue(valuePart: string): string {
  const v = valuePart.trim();
  if (!v) return escapeHtml(valuePart);

  const quoted =
    (v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'));
  if (quoted) {
    const lead = valuePart.slice(0, valuePart.indexOf(v[0]) + 1);
    const trail = valuePart.slice(valuePart.lastIndexOf(v[v.length - 1]));
    const inner = v.slice(1, -1);
    return `${escapeHtml(lead)}<span class="ocs-console-yaml-editor__string">${escapeHtml(inner)}</span>${escapeHtml(trail.slice(1))}`;
  }

  if (/^-?\d+(\.\d+)?$/.test(v)) {
    return `<span class="ocs-console-yaml-editor__number">${escapeHtml(valuePart)}</span>`;
  }

  if (v === "true" || v === "false" || v === "null" || v === "~") {
    return `<span class="ocs-console-yaml-editor__bool">${escapeHtml(valuePart)}</span>`;
  }

  return `<span class="ocs-console-yaml-editor__plain">${escapeHtml(valuePart)}</span>`;
}

export function yamlLineCount(yaml: string): number {
  if (!yaml) return 1;
  return yaml.split("\n").length;
}
