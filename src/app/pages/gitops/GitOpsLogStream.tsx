import { useEffect, useRef, useState } from "react";
import { Button, CodeBlock, CodeBlockCode, Flex } from "@patternfly/react-core";

const EXTRA_LINES = [
  'time="2026-08-25T14:22:04Z" level=info msg="Reconciliation completed"',
  'time="2026-08-25T14:22:08Z" level=info msg="Refreshing application state"',
  'time="2026-08-25T14:22:12Z" level=info msg="Comparing desired state"',
];

type GitOpsLogStreamProps = {
  initial: string;
  container: string;
};

export default function GitOpsLogStream({ initial, container }: GitOpsLogStreamProps) {
  const [streaming, setStreaming] = useState(true);
  const [text, setText] = useState(initial);
  const tick = useRef(0);

  useEffect(() => {
    setText(initial);
    tick.current = 0;
  }, [initial, container]);

  useEffect(() => {
    if (!streaming) return undefined;
    const id = window.setInterval(() => {
      const line = EXTRA_LINES[tick.current % EXTRA_LINES.length];
      tick.current += 1;
      setText((prev) => `${prev}\n${line}`);
    }, 2500);
    return () => window.clearInterval(id);
  }, [streaming, container]);

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
      <Flex gap={{ default: "gapSm" }}>
        <Button variant={streaming ? "primary" : "secondary"} onClick={() => setStreaming(true)}>
          Resume stream
        </Button>
        <Button variant={!streaming ? "primary" : "secondary"} onClick={() => setStreaming(false)}>
          Pause
        </Button>
      </Flex>
      <CodeBlock>
        <CodeBlockCode>{text}</CodeBlockCode>
      </CodeBlock>
    </Flex>
  );
}
