import { Button, Flex, Tooltip } from "@patternfly/react-core";
import { RhAiExperienceIcon } from "@/components/icons/RhAiExperienceIcon";
import { useChat } from "../../contexts/ChatContext";
import {
  GITOPS_ASK_IN_LIGHTSPEED_LABEL,
  GITOPS_ASK_IN_LIGHTSPEED_TOOLTIP,
} from "./gitopsAgenticCopy";

/** Secondary access: OLS chat with agentic run context (Peter / HPUX-2424). */
export function GitOpsAgenticRunDetailActions({ runId }: { runId: string }) {
  const { clearMessages, setContext, setIsOpen } = useChat();

  const openChatWithRunContext = () => {
    clearMessages();
    setContext(`ols-gitops-sync-troubleshoot:${runId}`);
    setIsOpen(true);
  };

  return (
    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
      <Tooltip content={GITOPS_ASK_IN_LIGHTSPEED_TOOLTIP}>
        <Button
          variant="secondary"
          icon={<RhAiExperienceIcon aria-hidden />}
          onClick={openChatWithRunContext}
        >
          {GITOPS_ASK_IN_LIGHTSPEED_LABEL}
        </Button>
      </Tooltip>
    </Flex>
  );
}
