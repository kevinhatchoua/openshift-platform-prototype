import { useState } from "react";
import CommentIcon from "@patternfly/react-icons/dist/esm/icons/comment-icon";
import WrenchIcon from "@patternfly/react-icons/dist/esm/icons/wrench-icon";
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from "@patternfly/react-core";
import { useChat } from "../../contexts/ChatContext";
import { LIGHTSPEED_CHAT_MODES, type LightspeedChatMode } from "./lightspeedModes";

const MODE_ICONS: Record<LightspeedChatMode, typeof CommentIcon> = {
  ask: CommentIcon,
  troubleshooting: WrenchIcon,
};

/** Shared Chat / Troubleshooting control for the masthead bar and the OLS panel. */
export default function LightspeedModeMenu({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen?: () => void;
}) {
  const { chatMode, setChatMode } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const active = LIGHTSPEED_CHAT_MODES[chatMode];
  const ActiveIcon = MODE_ICONS[chatMode];

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) onOpen?.();
      }}
      onSelect={(_event, value) => {
        if (value === "ask" || value === "troubleshooting") {
          setChatMode(value);
        }
        setIsOpen(false);
      }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          className={compact ? "ols-ask-toggle ols-ask-toggle--compact" : "ols-ask-toggle"}
          onClick={() => setIsOpen((open) => !open)}
          isExpanded={isOpen}
          aria-label={`OpenShift Lightspeed mode, ${active.label}`}
        >
          <ActiveIcon />
          <span>{active.label}</span>
        </MenuToggle>
      )}
    >
      <DropdownList className="ols-ask-menu">
        {(Object.keys(LIGHTSPEED_CHAT_MODES) as LightspeedChatMode[]).map((mode) => {
          const option = LIGHTSPEED_CHAT_MODES[mode];
          const Icon = MODE_ICONS[mode];
          return (
            <DropdownItem
              key={mode}
              value={mode}
              icon={<Icon />}
              description={option.description}
              isSelected={chatMode === mode}
            >
              {option.label}
            </DropdownItem>
          );
        })}
      </DropdownList>
    </Dropdown>
  );
}
