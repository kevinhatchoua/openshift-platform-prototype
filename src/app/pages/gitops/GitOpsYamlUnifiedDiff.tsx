import { useMemo } from "react";
import { Content, Flex, Title } from "@patternfly/react-core";

type DiffLine = {
  text: string;
  type: "same" | "add" | "remove";
};

function buildUnifiedDiff(live: string, desired: string): DiffLine[] {
  const liveLines = live.split("\n");
  const desiredLines = desired.split("\n");
  const max = Math.max(liveLines.length, desiredLines.length);
  const lines: DiffLine[] = [];
  for (let i = 0; i < max; i += 1) {
    const l = liveLines[i];
    const d = desiredLines[i];
    if (l === d) {
      if (l !== undefined) lines.push({ text: `  ${l}`, type: "same" });
    } else {
      if (l !== undefined) lines.push({ text: `- ${l}`, type: "remove" });
      if (d !== undefined) lines.push({ text: `+ ${d}`, type: "add" });
    }
  }
  return lines;
}

export default function GitOpsYamlUnifiedDiff({ live, desired }: { live: string; desired: string }) {
  const lines = useMemo(() => buildUnifiedDiff(live, desired), [live, desired]);
  const changed = lines.some((l) => l.type !== "same");

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
      <Title headingLevel="h2" size="lg">
        Unified diff
      </Title>
      {!changed ? (
        <Content component="p" className="pf-v6-u-color-200">
          No line-level differences between live and desired manifests.
        </Content>
      ) : null}
      <pre className="ocs-gitops-unified-diff" aria-label="Unified YAML diff">
        {lines.map((line, index) => (
          <div
            key={`${index}-${line.text}`}
            className={`ocs-gitops-unified-diff__line ocs-gitops-unified-diff__line--${line.type}`}
          >
            {line.text}
          </div>
        ))}
      </pre>
    </Flex>
  );
}
