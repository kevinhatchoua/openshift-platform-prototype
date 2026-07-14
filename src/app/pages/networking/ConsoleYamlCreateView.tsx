import { useCallback, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Button, Content, Divider, Flex, Title } from "@patternfly/react-core";
import CompressIcon from "@patternfly/react-icons/dist/esm/icons/compress-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import QuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/question-circle-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import PanelOpenIcon from "@patternfly/react-icons/dist/esm/icons/panel-open-icon";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";

export type ConsoleSchemaField = {
  name: string;
  type: string;
  description: string;
  allowedValues?: string;
  docsHref?: string;
  hasViewDetails?: boolean;
};

type ConsoleYamlCreateViewProps = {
  yamlText: string;
  onYamlChange: (value: string) => void;
  schemaTitle: string;
  schemaIntro: string;
  schemaFields: ConsoleSchemaField[];
  ariaLabel?: string;
};

function highlightYamlLine(line: string): ReactNode {
  if (!line.trim()) {
    return "\u00a0";
  }
  // Comment
  if (line.trimStart().startsWith("#")) {
    return <span className="ocs-console-yaml__tok-comment">{line}</span>;
  }
  // List item with key
  const listKey = line.match(/^(\s*-\s*)([^:\s#][^:]*)(:)(.*)$/);
  if (listKey) {
    return (
      <>
        <span className="ocs-console-yaml__tok-plain">{listKey[1]}</span>
        <span className="ocs-console-yaml__tok-key">{listKey[2]}</span>
        <span className="ocs-console-yaml__tok-plain">{listKey[3]}</span>
        <span className="ocs-console-yaml__tok-value">{listKey[4]}</span>
      </>
    );
  }
  // key: value
  const kv = line.match(/^(\s*)([^:\s#][^:]*)(:)(.*)$/);
  if (kv) {
    return (
      <>
        <span className="ocs-console-yaml__tok-plain">{kv[1]}</span>
        <span className="ocs-console-yaml__tok-key">{kv[2]}</span>
        <span className="ocs-console-yaml__tok-plain">{kv[3]}</span>
        <span className="ocs-console-yaml__tok-value">{kv[4]}</span>
      </>
    );
  }
  return <span className="ocs-console-yaml__tok-plain">{line}</span>;
}

/**
 * Console-faithful YAML create layout: Monaco-style editor + Schema sidebar.
 * Visual/interaction prototype — not a full Monaco integration.
 */
export function ConsoleYamlCreateView({
  yamlText,
  onYamlChange,
  schemaTitle,
  schemaIntro,
  schemaFields,
  ariaLabel = "Resource YAML",
}: ConsoleYamlCreateViewProps) {
  const [schemaOpen, setSchemaOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => yamlText.split("\n"), [yamlText]);

  const updateActiveLine = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const upto = el.value.slice(0, el.selectionStart);
    setActiveLine(upto.split("\n").length - 1);
  }, []);

  const syncScroll = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = el.scrollTop;
      highlightRef.current.scrollLeft = el.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = el.scrollTop;
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlText);
    } catch {
      /* ignore */
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onYamlChange(reader.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`ocs-console-yaml${isExpanded ? " ocs-console-yaml--expanded" : ""}`}>
      <div className={`ocs-console-yaml__workspace${schemaOpen ? "" : " ocs-console-yaml__workspace--no-sidebar"}`}>
        <div
          className={`ocs-console-yaml__editor-shell${isDragOver ? " ocs-console-yaml__editor-shell--drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="ocs-console-yaml__toolbar">
            <Flex gap={{ default: "gapXs" }}>
              <Button variant="plain" aria-label="Copy to clipboard" onClick={handleCopy} icon={<CopyIcon />} />
              <Button variant="plain" aria-label="Editor settings" icon={<CogIcon />} />
              <Button
                variant="plain"
                aria-label={isExpanded ? "Exit full screen" : "Expand editor"}
                onClick={() => setIsExpanded((v) => !v)}
                icon={isExpanded ? <CompressIcon /> : <ExpandIcon />}
              />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <Button
                variant="plain"
                aria-label={schemaOpen ? "Hide sidebar" : "Show sidebar"}
                aria-pressed={schemaOpen}
                onClick={() => setSchemaOpen((v) => !v)}
                icon={<PanelOpenIcon />}
              />
              <Button variant="link" isInline icon={<QuestionCircleIcon />} iconPosition="end">
                Shortcuts
              </Button>
            </Flex>
          </div>

          <div className="ocs-console-yaml__editor">
            <div className="ocs-console-yaml__gutter" aria-hidden ref={gutterRef}>
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`ocs-console-yaml__line-num${i === activeLine ? " ocs-console-yaml__line-num--active" : ""}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="ocs-console-yaml__code-wrap">
              <pre className="ocs-console-yaml__highlight" aria-hidden ref={highlightRef}>
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={`ocs-console-yaml__hl-line${i === activeLine ? " ocs-console-yaml__hl-line--active" : ""}`}
                  >
                    {highlightYamlLine(line)}
                  </div>
                ))}
              </pre>
              <textarea
                ref={textareaRef}
                id="create-resource-yaml"
                className="ocs-console-yaml__textarea"
                value={yamlText}
                spellCheck={false}
                aria-label={ariaLabel}
                onChange={(e) => {
                  onYamlChange(e.target.value);
                  updateActiveLine();
                }}
                onScroll={syncScroll}
                onClick={updateActiveLine}
                onKeyUp={updateActiveLine}
                onSelect={updateActiveLine}
              />
            </div>
          </div>
        </div>

        {schemaOpen ? (
          <aside className="ocs-console-yaml__sidebar" aria-label={`${schemaTitle} schema`}>
            <Flex
              className="ocs-console-yaml__sidebar-header"
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsCenter" }}
            >
              <Title headingLevel="h2" size="lg">
                {schemaTitle}
              </Title>
              <Button variant="plain" aria-label="Close sidebar" onClick={() => setSchemaOpen(false)} icon={<TimesIcon />} />
            </Flex>
            <div className="ocs-console-yaml__sidebar-tabs" role="tablist" aria-label="Sidebar sections">
              <button type="button" className="ocs-console-yaml__sidebar-tab ocs-console-yaml__sidebar-tab--active" role="tab" aria-selected>
                Schema
              </button>
            </div>
            <div className="ocs-console-yaml__sidebar-body">
              <Content component="p" className="ocs-console-yaml__sidebar-intro">
                {schemaIntro}
              </Content>
              {schemaFields.map((field) => (
                <div key={field.name} className="ocs-console-yaml__field">
                  <div className="ocs-console-yaml__field-name">
                    <strong>{field.name}</strong>{" "}
                    <span className="ocs-console-yaml__field-type">{field.type}</span>
                  </div>
                  <Content component="p" className="ocs-console-yaml__field-desc">
                    {field.description}
                  </Content>
                  {field.docsHref ? (
                    <Button
                      variant="link"
                      isInline
                      component="a"
                      href={field.docsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<ExternalLinkAltIcon />}
                      iconPosition="end"
                    >
                      View documentation
                    </Button>
                  ) : null}
                  {field.allowedValues ? (
                    <Content component="p" className="ocs-console-yaml__field-allowed">
                      Allowed values: {field.allowedValues}
                    </Content>
                  ) : null}
                  {field.hasViewDetails ? (
                    <Button variant="link" isInline>
                      View details
                    </Button>
                  ) : null}
                  <Divider className="ocs-console-yaml__field-divider" />
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
