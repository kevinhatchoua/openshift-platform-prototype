import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Copy, ThumbsDown, ThumbsUp, Trash2 } from "@/lib/pfIcons";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import CodeIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";
import CompressIcon from "@patternfly/react-icons/dist/esm/icons/compress-icon";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import MinusIcon from "@patternfly/react-icons/dist/esm/icons/minus-icon";
import PaperPlaneIcon from "@patternfly/react-icons/dist/esm/icons/paper-plane-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import SquareIcon from "@patternfly/react-icons/dist/esm/icons/outlined-square-icon";
import {
  Button,
  Label,
} from "@patternfly/react-core";
import { useChat } from "../contexts/ChatContext";
import { useNavigate, useLocation } from "react-router";
import {
  getAIResponse,
  getApplyRemediationResponse,
  getClusterSettingsPrecheckResponse,
  getGitOpsHealthRemediationResponse,
  getGitOpsSyncTroubleshootResponse,
  getGitOpsRolloutDiagnoseResponse,
  getGitOpsFleetAssessmentResponse,
  getPreflightRemediationResponse,
  getClusterExtensionPrecheckResponse,
  getClusterExtensionTroubleshootResponse,
  getUpdateStatusResponse,
} from "./LightSpeedPanelResponses";
import { getAgenticUpdateRun } from "../constants/agenticUpdateRuns";
import { getStoredUpdatePlan } from "../lib/updatePlansStore";

function resolveAgenticRun(runId: string) {
  return getStoredUpdatePlan(runId) ?? getAgenticUpdateRun(runId);
}
import { getTopologyLightspeedResponse } from "../pages/networking/topology/topologyLightspeedResponses";
import {
  LightspeedHeaderNotice,
  LightspeedWelcomeNotice,
  LightspeedComposerFooter,
  OLS_WELCOME_HEADLINE,
  OLS_WELCOME_CAUTION,
} from "./lightspeed/LightspeedLegalCopy";
import { OpenShiftLightspeedIcon } from "./lightspeed/OpenShiftLightspeedIcon";
import LightspeedModeMenu from "./lightspeed/LightspeedModeMenu";
import { LIGHTSPEED_CHAT_MODES } from "./lightspeed/lightspeedModes";

interface LightSpeedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dockTop?: number | null;
  context?: string;
}

export default function LightSpeedPanel({ isOpen, onClose, dockTop = null }: LightSpeedPanelProps) {
  const {
    messages,
    addMessage,
    clearMessages,
    context: chatContext,
    setContext,
    chatMode,
    setChatMode,
    pendingPrompt,
    clearPendingPrompt,
  } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentPromptTickets = useRef(new Set<number>());
  const addMessageRef = useRef(addMessage);
  const clearPendingPromptRef = useRef(clearPendingPrompt);
  addMessageRef.current = addMessage;
  clearPendingPromptRef.current = clearPendingPrompt;

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);
  const activeMode = LIGHTSPEED_CHAT_MODES[chatMode];

  const handleMinimize = () => {
    setShowWelcomeAlert(false);
    onClose();
  };

  const getTypingDelay = (content: string): number => {
    const length = content.length;
    if (length < 200) return 600 + Math.random() * 300;
    if (length < 500) return 1000 + Math.random() * 400;
    if (length < 1000) return 1500 + Math.random() * 500;
    if (length < 2000) return 2200 + Math.random() * 600;
    return 2800 + Math.random() * 700;
  };

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && chatContext === "pod-debug") {
      setChatMode("troubleshooting");
      setShowWelcomeAlert(false);
      setContext("");
    }
  }, [isOpen, chatContext, setContext]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      window.setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    if (!isOpen || !chatContext) return undefined;

    let report: { content: string; tools?: string[]; sources?: Array<{ title: string; href: string }>; suggestions?: string[] } | null =
      null;

    if (chatContext === "ols-update-status") {
      report = getUpdateStatusResponse();
    } else if (chatContext === "ols-preflight" || chatContext.startsWith("ols-preflight:")) {
      const parts = chatContext.split(":");
      const version = parts[1] || undefined;
      const channel = parts[2] || undefined;
      report = getClusterSettingsPrecheckResponse(version, channel);
    } else if (chatContext === "ols-preflight-remediation") {
      report = getPreflightRemediationResponse();
    } else if (chatContext === "ols-preflight-apply-remediation") {
      report = getApplyRemediationResponse();
    } else if (chatContext.startsWith("ols-topology:")) {
      report = getTopologyLightspeedResponse(chatContext);
    } else if (chatContext.startsWith("ols-gitops-health-remediation:")) {
      const [, namespace, applicationName] = chatContext.split(":");
      if (namespace && applicationName) {
        report = getGitOpsHealthRemediationResponse(applicationName, namespace);
      }
    } else if (chatContext.startsWith("ols-cluster-extension-precheck:")) {
      const runId = chatContext.split(":")[1];
      const run = runId ? getStoredUpdatePlan(runId) : undefined;
      if (run) {
        report = getClusterExtensionPrecheckResponse(run);
      }
    } else if (chatContext.startsWith("ols-cluster-extension-troubleshoot:")) {
      const runId = chatContext.split(":")[1];
      const run = runId ? getStoredUpdatePlan(runId) : undefined;
      if (run) {
        report = getClusterExtensionTroubleshootResponse(run);
      }
    } else if (chatContext.startsWith("ols-gitops-sync-troubleshoot:")) {
      const runId = chatContext.split(":")[1];
      const run = runId ? resolveAgenticRun(runId) : undefined;
      if (run) {
        report = getGitOpsSyncTroubleshootResponse(
          run.extensionName ?? "unknown",
          run.extensionNamespace ?? run.namespace,
          run.attentionSummary ?? "",
        );
      }
    } else if (chatContext.startsWith("ols-gitops-rollout-diagnose:")) {
      const runId = chatContext.split(":")[1];
      const run = runId ? resolveAgenticRun(runId) : undefined;
      if (run) {
        report = getGitOpsRolloutDiagnoseResponse(
          run.extensionName ?? "unknown",
          run.namespace,
          run.attentionSummary ?? "",
        );
      }
    } else if (chatContext === "ols-gitops-fleet-assess") {
      report = getGitOpsFleetAssessmentResponse(3, 12);
    }

    if (!report) return undefined;

    setIsTyping(true);
    setSourceIndex(0);
    const delay = getTypingDelay(report.content);
    let cancelled = false;
    const payload = report;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      addMessage({
        type: "ai",
        content: payload.content,
        tools: payload.tools,
        sources: payload.sources,
        suggestions: payload.suggestions,
      });
      setIsTyping(false);
      setContext("");
    }, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, chatContext]);

  const formatText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="ols-inline-code">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const sendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    addMessage({ type: "user", content: trimmed });
    setIsTyping(true);
    const response = getAIResponse(trimmed, location.pathname);
    const delay = getTypingDelay(response.content);
    window.setTimeout(() => {
      addMessage({
        type: "ai",
        content: response.content,
        suggestions: response.suggestions,
        tools: response.tools,
        sources: response.sources,
      });
      setIsTyping(false);
    }, delay);
  };

  const handleSendMessage = () => {
    if (!input.trim() || isTyping) return;
    const userQuery = input;
    setInput("");
    sendText(userQuery);
  };

  useEffect(() => {
    if (!isOpen || !pendingPrompt) return undefined;
    const { text, ticket } = pendingPrompt;
    if (sentPromptTickets.current.has(ticket)) return undefined;
    let cancelled = false;
    const start = window.setTimeout(() => {
      if (cancelled || sentPromptTickets.current.has(ticket)) return;
      sentPromptTickets.current.add(ticket);
      clearPendingPromptRef.current();
      addMessageRef.current({ type: "user", content: text });
      setIsTyping(true);
      const response = getAIResponse(text, location.pathname);
      const delay = getTypingDelay(response.content);
      window.setTimeout(() => {
        addMessageRef.current({
          type: "ai",
          content: response.content,
          suggestions: response.suggestions,
          tools: response.tools,
          sources: response.sources,
        });
        setIsTyping(false);
      }, delay);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, [isOpen, pendingPrompt, location.pathname]);

  const handleSuggestionClick = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    addMessage({ type: "user", content: suggestion });
    if (lowerSuggestion.includes("open cluster update")) {
      navigate("/administration/cluster-update");
      return;
    }
    if (lowerSuggestion.includes("apply recommended remediation")) {
      setContext("ols-preflight-apply-remediation");
      return;
    }
    if (lowerSuggestion.includes("re-run pre-flight") || lowerSuggestion.includes("re-run preflight")) {
      setContext(`ols-preflight`);
      navigate("/administration/cluster-update");
      return;
    }
    if (lowerSuggestion.includes("update status")) {
      setContext("ols-update-status");
      return;
    }
    if (lowerSuggestion.includes("open agentic run")) {
      const runId =
        chatContext.startsWith("ols-cluster-extension-precheck:") ||
        chatContext.startsWith("ols-cluster-extension-troubleshoot:") ||
        chatContext.startsWith("ols-gitops-sync-troubleshoot:") ||
        chatContext.startsWith("ols-gitops-rollout-diagnose:")
          ? chatContext.split(":")[1]
          : undefined;
      if (runId) {
        navigate(`/agentic-runs/${encodeURIComponent(runId)}`);
        return;
      }
    }
    setIsTyping(true);
    const response = getAIResponse(suggestion, location.pathname);
    const delay = getTypingDelay(response.content);
    window.setTimeout(() => {
      addMessage({
        type: "ai",
        content: response.content,
        suggestions: response.suggestions,
        tools: response.tools,
        sources: response.sources,
      });
      setIsTyping(false);
    }, delay);
  };

  const lastAiWithSources = [...messages].reverse().find((message) => message.type === "ai" && message.sources?.length);
  const activeSource = lastAiWithSources?.sources?.[sourceIndex];

  if (!isOpen) return null;

  const panel = (
    <div
      className={`ols-panel ${isExpanded ? "ols-panel--expanded" : ""}`}
      style={{ top: dockTop ?? 0, ["--ols-dock-top" as string]: `${dockTop ?? 0}px` }}
    >
      <div className="ols-panel__inner">
        <header className="ols-panel__header">
          <div className="ols-panel__title">
            <OpenShiftLightspeedIcon size={32} />
            <span>Red Hat OpenShift Lightspeed</span>
          </div>
          <div className="ols-panel__header-actions">
            <Button variant="plain" aria-label="Clear conversation" icon={<Trash2 />} onClick={() => clearMessages()} />
            <Button
              variant="plain"
              aria-label="Copy last response"
              icon={<Copy />}
              onClick={() => {
                const last = [...messages].reverse().find((message) => message.type === "ai");
                if (last?.content) navigator.clipboard?.writeText(last.content);
              }}
            />
            <Button
              variant="plain"
              aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
              icon={isExpanded ? <CompressIcon /> : <ExpandIcon />}
              onClick={() => setIsExpanded((value) => !value)}
            />
            <Button variant="plain" aria-label="Minimize OpenShift Lightspeed" icon={<MinusIcon />} onClick={handleMinimize} />
          </div>
        </header>

        <div ref={messagesScrollRef} className="ols-panel__body" role="log" aria-live="polite">
          {!hasConversation ? (
            <>
              <div className="ols-welcome">
                <OpenShiftLightspeedIcon size={72} className="ols-welcome__logo" />
                <p>{OLS_WELCOME_HEADLINE}</p>
                <p>{OLS_WELCOME_CAUTION}</p>
              </div>
              {showWelcomeAlert ? <LightspeedWelcomeNotice /> : null}
              <LightspeedHeaderNotice />
            </>
          ) : null}

          {messages.map((message) =>
            message.type === "user" ? (
              <div key={message.id} className="ols-msg ols-msg--user">
                <p>{message.content}</p>
              </div>
            ) : (
              <div key={message.id} className="ols-msg ols-msg--ai">
                <div className="ols-msg__meta">
                  <OpenShiftLightspeedIcon size={28} />
                  <span>OpenShift Lightspeed</span>
                  <Label isCompact>AI</Label>
                </div>
                <div className="ols-msg__body">{formatText(message.content || "")}</div>
                {message.tools && message.tools.length > 0 ? (
                  <div className="ols-tools">
                    {message.tools.map((tool) => (
                      <span key={tool} className="ols-tool-chip">
                        <CodeIcon /> {tool}
                      </span>
                    ))}
                    <Button variant="link" isInline>
                      10 more
                    </Button>
                  </div>
                ) : null}
                {message.sources && message.sources.length > 0 && activeSource && lastAiWithSources?.id === message.id ? (
                  <div className="ols-sources">
                    <p className="ols-sources__heading">{message.sources.length} sources</p>
                    <div className="ols-sources__card">
                      <a href={activeSource.href} target="_blank" rel="noopener noreferrer">
                        {activeSource.title}
                        <ExternalLinkAltIcon />
                      </a>
                      <div className="ols-sources__nav">
                        <Button
                          variant="plain"
                          aria-label="Previous source"
                          icon={<AngleLeftIcon />}
                          onClick={() =>
                            setSourceIndex((index) =>
                              index === 0 ? message.sources!.length - 1 : index - 1
                            )
                          }
                        />
                        <span>
                          {sourceIndex + 1}/{message.sources.length}
                        </span>
                        <Button
                          variant="plain"
                          aria-label="Next source"
                          icon={<AngleRightIcon />}
                          onClick={() =>
                            setSourceIndex((index) => (index + 1) % message.sources!.length)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                {message.suggestions && message.suggestions.length > 0 ? (
                  <div className="ols-suggestions">
                    {message.suggestions.map((suggestion) => (
                      <Button key={suggestion} variant="secondary" onClick={() => handleSuggestionClick(suggestion)}>
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                ) : null}
                <div className="ols-msg__actions">
                  <Button variant="plain" aria-label="Good response" icon={<ThumbsUp />} />
                  <Button variant="plain" aria-label="Bad response" icon={<ThumbsDown />} />
                  <Button
                    variant="plain"
                    aria-label="Copy"
                    icon={<Copy />}
                    onClick={() => navigator.clipboard?.writeText(message.content || "")}
                  />
                </div>
              </div>
            )
          )}

          {isTyping ? (
            <div className="ols-msg ols-msg--ai">
              <div className="ols-msg__meta">
                <OpenShiftLightspeedIcon size={28} />
                <span>OpenShift Lightspeed</span>
                <Label isCompact>AI</Label>
              </div>
              <div className="ols-typing" aria-label="OpenShift Lightspeed is responding">
                <span />
                <span />
              </div>
            </div>
          ) : null}
        </div>

        <div className="ols-composer">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={activeMode.placeholder}
            aria-label={activeMode.placeholder}
            rows={3}
          />
          <div className="ols-composer__toolbar">
            <div className="ols-composer__start">
              <Button variant="plain" aria-label="Add attachment" icon={<PlusIcon />} />
              <div className="ols-composer__mode">
                <LightspeedModeMenu />
              </div>
            </div>
            {isTyping ? (
              <Button
                variant="plain"
                aria-label="Stop generating"
                className="ols-composer__send ols-composer__send--stop"
                icon={<SquareIcon />}
                onClick={() => setIsTyping(false)}
              />
            ) : (
              <Button
                variant="plain"
                aria-label="Send"
                className="ols-composer__send"
                icon={<PaperPlaneIcon />}
                onClick={handleSendMessage}
                isDisabled={!input.trim()}
              />
            )}
          </div>
        </div>
        <LightspeedComposerFooter />
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
