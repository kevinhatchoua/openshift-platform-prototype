import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Send, ThumbsUp, ThumbsDown, Copy, Bookmark, Volume2, Paperclip, Bot } from "@/lib/pfIcons";
import { useChat } from "../contexts/ChatContext";
import { useNavigate, useLocation } from "react-router";
import { getAIResponse } from "./LightSpeedPanelResponses";
import { LightspeedHeaderNotice, LightspeedAiMessageFooter } from "./lightspeed/LightspeedLegalCopy";

interface Message {
  id: string;
  type?: 'user' | 'assistant' | 'ai';
  sender?: 'user' | 'ai';
  content?: string;
  text?: string;
  timestamp: Date;
  suggestions?: string[];
  loading?: boolean;
  action?: {
    label: string;
    type: 'pre-check' | 'update' | 'cancel';
    callback: () => void;
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

interface LightSpeedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Viewport Y (px) for top edge; panel uses `bottom: 0` so height never tracks main content scroll height. */
  dockTop?: number | null;
  context?: string;
  onLaunchPreCheck?: () => void;
  onStartUpdate?: () => void;
  preloadedMessages?: Message[];
  autoScroll?: boolean;
  externalMessages?: Message[];
}

export default function LightSpeedPanel({
  isOpen,
  onClose,
  dockTop = null,
  context,
}: LightSpeedPanelProps) {
  const { messages: globalMessages, addMessage, replaceMessage, context: globalContext, setContext } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastContextPath, setLastContextPath] = useState('');
  const [hasInitialGreeting, setHasInitialGreeting] = useState(false);

  const getTypingDelay = (content: string): number => {
    const length = content.length;
    if (length < 200) return 600 + Math.random() * 300;
    if (length < 500) return 1000 + Math.random() * 400;
    if (length < 1000) return 1500 + Math.random() * 500;
    if (length < 2000) return 2200 + Math.random() * 600;
    return 2800 + Math.random() * 700;
  };

  const messages = globalMessages;

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    /** Do not use scrollIntoView — it can scroll the page behind a fixed/portaled panel. */
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) {
      setLastContextPath('');
      setHasInitialGreeting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !hasInitialGreeting && context) {
      setContext(context);
      let contextMessage = '';
      let suggestions: string[] = [];

      if (location.pathname === '/' || location.pathname === '') {
        contextMessage = "Hi Kevin! I can see you're on the **Dashboard**. Your cluster looks healthy overall!\n\n**Quick Overview:**\n• **2 alerts** need attention (1 warning about retrieval updates, 1 info about service level)\n• Cluster utilization is normal across CPU, Memory, and Filesystem\n• **Control Plane** and **Operators** are running smoothly\n\n**What would you like me to help with?**";
        suggestions = ['Explain the retrieval updates alert', 'Show cluster health status', 'Check for cluster updates', 'Which operators need updates?'];
      } else if (location.pathname.includes('/preflight-results')) {
        contextMessage = "**Great news!** All pre-checks passed successfully.\n\n**What I found:**\n• All 8 checks completed without critical issues\n• Cluster health is optimal for update\n• All operators are compatible with OpenShift 4.22.0\n• Estimated update time: 2 hours 12 minutes\n\n**Recommended Next Steps:**\n1. **Start the cluster update** - Your cluster is ready to proceed\n2. **Review operator updates** - 1 operator (Ansible Automation Platform) has an update available\n3. **Check API migrations** - 1 API requires permission verification";
        suggestions = ["Start the cluster update", "How do I update the Ansible Automation Platform operator?", "What API changes should I be aware of?"];
      } else if (location.pathname.includes('/preflight-failed')) {
        contextMessage = "**Pre-checks found issues that need attention.**\n\nI've analyzed the failures and can guide you through fixing each one.";
        suggestions = ["Show me step-by-step remediation", "Help me fix the storage issue", "What's causing the failures?", "Can I proceed despite the warnings?"];
      } else if (location.pathname.includes('/ecosystem/installed-operators') || location.pathname.includes('/administration/installed-operators')) {
        contextMessage = "I can see you're on **Installed Operators** (catalog / OLM operators). This aligns with the **consolidated AI** direction: catalog readiness is judged together with **platform operators** on Cluster Update—one holistic pre-check and status story.\n\n**Current Status:**\n• **5 operators** installed and healthy\n• **4 updates** available\n• **2 operators** require updates before cluster update\n\n**What would you like to know?**";
        suggestions = ["Holistic pre-check from AI Assessment", "Which operators need updates?", "How do I update all operators?"];
      } else if (location.pathname.includes('/cluster-update/in-progress')) {
        contextMessage = "**Cluster update in progress!**\n\nYour cluster is currently updating to OpenShift 4.22.0. I'm monitoring the progress.\n\n**Current Status:**\n• Control plane nodes: Updating (1 of 3 complete)\n• Worker nodes: Waiting\n• Estimated time remaining: ~1 hour 45 minutes";
        suggestions = ["What's happening right now?", "How long will this take?", "What if something goes wrong?"];
      } else if (location.pathname.includes('/cluster-update/complete')) {
        contextMessage = "**Congratulations!** Your cluster update to OpenShift 4.22.0 completed successfully!\n\n**Update Summary:**\n• All nodes updated without issues\n• Control plane is healthy\n• All workloads are running\n• No operator conflicts detected";
        suggestions = ["Show me what changed", "Which operators still need updates?", "How do I verify everything works?"];
      } else if (location.pathname.includes('/cluster-update')) {
        contextMessage = "I can see you're planning a **cluster update**. The consolidated AI experience treats **platform operators** and **Software Catalog (OLM) operators** as one readiness story—pre-checks and status updates cover both.\n\n**I can help with:**\n• Holistic pre-checks (cluster + catalog)\n• Explaining risks and compatibility across both layers\n• Guiding through the update process\n• Troubleshooting any issues\n\nWhat would you like to know?";
        suggestions = ['Assess readiness with Lightspeed', 'Platform vs catalog blockers?', 'How long will it take?'];
      } else if (location.pathname.includes('/administration')) {
        contextMessage = "I can help with **cluster administration** tasks like namespaces, resources, settings, and more. What do you need help with?";
        suggestions = ['Show cluster settings', 'Check for updates', 'Manage operators'];
      } else if (location.pathname.includes('/workloads')) {
        contextMessage = "I can see you're managing **Workloads**. You have a healthy mix of Pods, Deployments, and StatefulSets running!\n\n**Quick Stats:**\n• Most workloads are running smoothly\n• A few restarts detected\n• 1 pod in pending state";
        suggestions = ['Why is a pod pending?', 'Explain pod restarts', 'How do I scale a deployment?'];
      } else if (location.pathname.includes('/observe')) {
        contextMessage = "I'm here to help you **monitor and observe** your cluster! I can analyze metrics, explain alerts, and suggest optimizations.";
        suggestions = ['Explain the critical alerts', 'Why is CPU usage high?', 'Optimize resource usage'];
      }

      if (contextMessage) {
        const lastMessage = messages[messages.length - 1];
        const isDefaultGreeting = lastMessage?.content?.includes("I'm OpenShift LightSpeed");
        if (isDefaultGreeting) {
          replaceMessage('1', { type: 'ai', content: contextMessage, suggestions: suggestions.length > 0 ? suggestions : undefined });
        }
      }
      setLastContextPath(location.pathname);
      setHasInitialGreeting(true);
    }
  }, [isOpen, context, location.pathname]);

  useEffect(() => {
    if (isOpen && hasInitialGreeting && lastContextPath && location.pathname !== lastContextPath) {
      let pageContext = '';
      let suggestions: string[] = [];
      if (location.pathname === '/' || location.pathname === '') {
        pageContext = "I see you're back on the **Dashboard**. Let me know if you need help!";
        suggestions = ['Show cluster health status', 'Check for cluster updates'];
      } else if (location.pathname.includes('/cluster-update/in-progress')) {
        pageContext = "You're now viewing the **cluster update progress**. I'm monitoring it closely!";
        suggestions = ["What's happening right now?", "How long will this take?"];
      } else if (location.pathname.includes('/cluster-update')) {
        pageContext = "You're now on the **Cluster Update** page. Ready to help!";
        suggestions = ['Assess readiness', 'What are the risks?'];
      } else if (location.pathname.includes('/ecosystem/installed-operators')) {
        pageContext = "Now viewing **Installed Operators**. Pre-checks here tie back to **platform + catalog** readiness on Cluster Update.";
        suggestions = ['Which operators need updates?', 'Open holistic pre-check'];
      } else if (location.pathname.includes('/administration')) {
        pageContext = "You're in **Administration**. How can I help?";
        suggestions = ['Show cluster settings', 'Check for updates'];
      }
      if (pageContext) {
        setTimeout(() => { addMessage({ type: 'ai', content: pageContext, suggestions: suggestions.length > 0 ? suggestions : undefined }); }, 300);
      }
      setLastContextPath(location.pathname);
    }
  }, [location.pathname, isOpen, hasInitialGreeting, lastContextPath]);

  const formatText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-[#151515] dark:text-[#f5f5f5]">{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-[#f0f0f0] dark:bg-[rgba(255,255,255,0.1)] px-[5px] py-[1px] rounded-[3px] text-[12px] font-['Red_Hat_Mono:Regular',monospace] text-[#151515] dark:text-[#f0f0f0]">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    addMessage({ type: 'user', content: input });
    const userQuery = input;
    setInput('');
    setIsTyping(true);
    const response = getAIResponse(userQuery, location.pathname);
    const delay = getTypingDelay(response.content);
    setTimeout(() => {
      addMessage({ type: 'ai', content: response.content, actions: response.actions, suggestions: response.suggestions });
      setIsTyping(false);
    }, delay);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    addMessage({ type: 'user', content: suggestion });
    if (lowerSuggestion.includes('run pre-check') || lowerSuggestion.includes('assess readiness')) {
      navigate('/administration/cluster-update/in-progress', { state: { aiMode: true } });
      return;
    }
    if (lowerSuggestion.includes('start') && lowerSuggestion.includes('cluster') && lowerSuggestion.includes('update')) {
      if (location.pathname.includes('/preflight-results')) { navigate('/administration/cluster-update/in-progress'); }
      else {
        const msg = "Great! Let's get your cluster updated to 4.22.0.\n\nFirst, let me run the pre-checks to make sure everything's ready.";
        setIsTyping(true);
        setTimeout(() => { addMessage({ type: 'ai', content: msg, suggestions: ["Assess readiness now"] }); setIsTyping(false); }, getTypingDelay(msg));
      }
      return;
    }
    if (lowerSuggestion.includes('operator') && lowerSuggestion.includes('update')) {
      navigate('/administration/installed-operators');
      const msg = "Taking you to the Installed Operators page where you can manage updates!";
      setIsTyping(true);
      setTimeout(() => { addMessage({ type: 'ai', content: msg }); setIsTyping(false); }, getTypingDelay(msg));
      return;
    }
    setIsTyping(true);
    const response = getAIResponse(suggestion, location.pathname);
    const delay = getTypingDelay(response.content);
    setTimeout(() => {
      addMessage({ type: 'ai', content: response.content, actions: response.actions, suggestions: response.suggestions });
      setIsTyping(false);
    }, delay);
  };

  const formatTimestamp = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (!isOpen) return null;

  /** Portaled to `document.body` with `position: fixed` — not a child of `#root` / main, so it does not scroll with page content. */
  const panel = (
    <div
      className="flex flex-col min-h-0 overflow-hidden"
      style={{
        position: "fixed",
        top: dockTop ?? 0,
        right: 0,
        bottom: 0,
        width: 420,
        zIndex: 500,
        pointerEvents: "auto",
        overscrollBehavior: "contain",
      }}
    >
      <div className="flex flex-col h-full app-glass-panel app-glass-panel--edge-right overflow-hidden">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-[10px]">
            <div className="size-[36px] rounded-full bg-[#f5f5f5] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
              <Bot className="size-[20px] text-[#ee0000]" aria-hidden />
            </div>
            <span className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-[#f5f5f5] text-[15px]">
              OpenShift LightSpeed
            </span>
          </div>
          <button onClick={onClose}
            className="p-[6px] hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] bg-transparent border-0 cursor-pointer transition-colors"
            title="Close">
            <X className="size-[18px] text-[#6a6e73] dark:text-[#e0e0e0]" />
          </button>
        </div>

        <LightspeedHeaderNotice />

        {/* ═══ MESSAGES ═══ */}
        <div
          ref={messagesScrollRef}
          className="flex-1 overflow-y-auto px-[20px] py-[16px] min-h-0"
          style={{ overscrollBehavior: "contain" }}
          role="log"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div key={message.id} className="mb-[20px]">
              {message.type === 'user' ? (
                /* ── User message ── */
                <div>
                  <div className="flex items-center gap-[8px] mb-[6px]">
                    <div className="size-[28px] rounded-full bg-[#e0e0e0] flex items-center justify-center shrink-0">
                      <span className="text-[12px] text-[#6a6e73] font-semibold">K</span>
                    </div>
                    <span className="text-[13px] text-[#151515] dark:text-[#f0f0f0] font-['Red_Hat_Text:Regular',sans-serif] font-medium">User</span>
                    <span className="text-[13px] text-[#8a8d90] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">{formatTimestamp(message.timestamp)}</span>
                  </div>
                  <div className="ml-[36px]">
                    <div className="inline-block bg-[#0066cc] text-white dark:text-white !text-white rounded-[20px] px-[16px] py-[10px] max-w-[90%] [&_p]:!text-white">
                      <p className="text-[14px] leading-[20px] font-['Red_Hat_Text:Regular',sans-serif] text-white">{message.content}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Bot message ── */
                <div>
                  <div className="flex items-center gap-[6px] mb-[6px]">
                    <span className="text-[13px] text-[#151515] dark:text-[#f0f0f0] font-['Red_Hat_Text:Regular',sans-serif] font-medium">OpenShift LightSpeed</span>
                    <span className="text-[11px] font-semibold text-[#6a6e73] dark:text-[#d0d0d0] bg-[#f0f0f0] dark:bg-[rgba(255,255,255,0.12)] rounded-[4px] px-[6px] py-[1px] uppercase tracking-wider font-['Red_Hat_Text:Regular',sans-serif]">AI</span>
                    <span className="text-[13px] text-[#8a8d90] dark:text-[#b0b0b0] font-['Red_Hat_Text:Regular',sans-serif]">{formatTimestamp(message.timestamp)}</span>
                  </div>
                  <div className="text-[14px] text-[#333] dark:text-[#e8e8e8] leading-[22px] font-['Red_Hat_Text:Regular',sans-serif] whitespace-pre-wrap">
                    {formatText(message.content || '')}
                  </div>
                  <div className="ml-0 max-w-full">
                    <LightspeedAiMessageFooter />
                  </div>

                  {/* Suggestion action buttons */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-[8px] mt-[12px]">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={`${message.id}-s-${idx}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`text-[13px] px-[16px] py-[8px] rounded-[20px] cursor-pointer transition-colors font-['Red_Hat_Text:Regular',sans-serif] font-medium ${
                            idx === 0
                              ? "bg-[#0066cc] text-white dark:text-white !text-white border-0 hover:bg-[#004d99] [&_svg]:text-white"
                              : "bg-white dark:bg-[#292929] !text-[var(--pf-color-blue-50)] text-[var(--pf-color-blue-50)] border border-[var(--pf-color-blue-50)] hover:bg-[#e7f1fa] hover:!text-[var(--pf-color-blue-50)] dark:hover:bg-[rgba(0,102,204,0.12)] [&_svg]:text-[var(--pf-color-blue-50)]"
                          }`}>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message actions row */}
                  <div className="flex items-center gap-[4px] mt-[12px]">
                    <button className="p-[6px] hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] bg-transparent border-0 cursor-pointer transition-colors" title="Good response">
                      <ThumbsUp className="size-[16px] text-[#b0b0b0] dark:text-[#d0d0d0]" />
                    </button>
                    <button className="p-[6px] hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] bg-transparent border-0 cursor-pointer transition-colors" title="Bad response">
                      <ThumbsDown className="size-[16px] text-[#b0b0b0] dark:text-[#d0d0d0]" />
                    </button>
                    <button className="p-[6px] hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] bg-transparent border-0 cursor-pointer transition-colors" title="Copy"
                      onClick={() => navigator.clipboard?.writeText(message.content || '')}>
                      <Copy className="size-[16px] text-[#b0b0b0] dark:text-[#d0d0d0]" />
                    </button>
                    <button className="p-[6px] hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] bg-transparent border-0 cursor-pointer transition-colors" title="Bookmark">
                      <Bookmark className="size-[16px] text-[#b0b0b0] dark:text-[#d0d0d0]" />
                    </button>
                    <button className="p-[6px] hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] bg-transparent border-0 cursor-pointer transition-colors" title="Listen">
                      <Volume2 className="size-[16px] text-[#b0b0b0] dark:text-[#d0d0d0]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="mb-[20px]">
              <div className="flex items-center gap-[6px] mb-[6px]">
                <span className="text-[13px] text-[#151515] dark:text-[#f0f0f0] font-['Red_Hat_Text:Regular',sans-serif] font-medium">OpenShift LightSpeed</span>
                <span className="text-[11px] font-semibold text-[#6a6e73] dark:text-[#d0d0d0] bg-[#f0f0f0] dark:bg-[rgba(255,255,255,0.12)] rounded-[4px] px-[6px] py-[1px] uppercase tracking-wider font-['Red_Hat_Text:Regular',sans-serif]">AI</span>
              </div>
              <div className="flex gap-[5px] items-center h-[22px]">
                <div className="size-[7px] bg-[#b0b0b0] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
                <div className="size-[7px] bg-[#b0b0b0] rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }} />
                <div className="size-[7px] bg-[#b0b0b0] rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }} />
              </div>
            </div>
          )}

        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="border-t border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] bg-transparent px-[16px] py-[12px]">
          <div className="flex items-center gap-[8px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Send a message..."
              className="flex-1 bg-transparent border-0 outline-none text-[14px] text-[#151515] dark:text-[#f0f0f0] font-['Red_Hat_Text:Regular',sans-serif] placeholder:text-[#b0b0b0] dark:placeholder:text-[#8a8d90] py-[4px]"
            />
            <button className="p-[6px] hover:bg-[#f0f0f0] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-[6px] bg-transparent border-0 cursor-pointer transition-colors" title="Attach file">
              <Paperclip className="size-[18px] text-[#6a6e73] dark:text-[#d0d0d0]" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="p-[6px] bg-transparent border-0 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Send">
              <Send className="size-[18px] text-[#0066cc]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
