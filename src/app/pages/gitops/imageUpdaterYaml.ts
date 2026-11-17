import type { ImageUpdaterRecord } from "./gitopsData";

function indentYaml(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.trim() ? `${pad}${line}` : ""))
    .join("\n");
}

export function buildImageUpdaterYaml(rec: ImageUpdaterRecord): string {
  const appRefs = rec.applicationRefs
    .map((ref) => {
      const images = ref.images
        .map((img) => {
          const settings: string[] = [`updateStrategy: ${img.updateStrategy}`];
          if (img.allowTags) settings.push(`allowTags: "${img.allowTags}"`);
          if (img.ignoreTags) settings.push(`ignoreTags: "${img.ignoreTags}"`);
          if (img.semverConstraint) settings.push(`versionConstraint: "${img.semverConstraint}"`);
          const lines = [
            `        - alias: ${img.alias}`,
            `          imageName: ${img.imageName}`,
            `          commonUpdateSettings:`,
            ...settings.map((s) => `            ${s}`),
          ];
          if (img.writeBackMethod) {
            lines.push(`          writeBackConfig:`);
            lines.push(`            method: ${img.writeBackMethod}`);
            if (img.writeBackTarget) lines.push(`            target: ${img.writeBackTarget}`);
          }
          return lines.join("\n");
        })
        .join("\n");
      return `    - namePattern: "${ref.namePattern}"\n      images:\n${images}`;
    })
    .join("\n");

  const conditions = rec.conditions
    .map(
      (c) =>
        `  - type: ${c.type}\n    status: "${c.status}"\n    reason: ${c.reason}\n    message: ${JSON.stringify(c.message)}\n    lastTransitionTime: "${c.lastTransitionTime}"`
    )
    .join("\n");

  const recent = rec.recentUpdates
    .map(
      (u) =>
        `  - alias: ${u.alias}\n    image: ${u.image}\n    newVersion: "${u.newVersion}"\n    applicationsUpdated: ${u.applicationsUpdated}\n    updatedAt: "${u.updatedAtIso}"\n    message: ${JSON.stringify(u.message)}`
    )
    .join("\n");

  return `apiVersion: argocd-image-updater.argoproj.io/v1alpha1
kind: ImageUpdater
metadata:
  name: ${rec.name}
  namespace: ${rec.ns}
spec:
  applicationRefs:
${appRefs}
status:
  applicationsMatched: ${rec.applicationsMatched}
  imagesManaged: ${rec.imagesManaged}
  lastCheckedAt: "${rec.lastCheckedAtIso}"
  lastUpdatedAt: "${rec.lastUpdatedAtIso ?? rec.lastCheckedAtIso}"
  conditions:
${conditions}
  recentUpdates:
${recent || "  []"}
`;
}