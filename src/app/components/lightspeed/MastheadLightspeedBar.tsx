import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Menu, MenuContent, MenuGroup, MenuItem, MenuList, Tooltip } from "@patternfly/react-core";
import PaperPlaneIcon from "@patternfly/react-icons/dist/esm/icons/paper-plane-icon";
import RobotIcon from "@patternfly/react-icons/dist/esm/icons/robot-icon";
import { useChat } from "../../contexts/ChatContext";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import LightspeedModeMenu from "./LightspeedModeMenu";
import {
  LIGHTSPEED_BAR_PLACEHOLDER,
  LIGHTSPEED_CHAT_MODES,
  lightspeedPromptSuggestions,
} from "./lightspeedModes";

const SUGGEST_LIST_ID = "ocs-masthead-lightspeed-suggestions";

/** Masthead OpenShift Lightspeed prompt. 5.1 includes Chat / Troubleshooting; 5.2 is prompt only. */
export default function MastheadLightspeedBar() {
  const { olsRelease } = usePrototypeDemo();
  const { chatMode, submitLightspeedPrompt } = useChat();
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const iconMode = true;
  const showMode = olsRelease === "5.1";
  const placeholder = showMode ? LIGHTSPEED_CHAT_MODES[chatMode].barPlaceholder : LIGHTSPEED_BAR_PLACEHOLDER;
  const suggestions = useMemo(
    () => lightspeedPromptSuggestions(chatMode, value),
    [chatMode, value],
  );
  const suggestionsOpen = !suggestionsDismissed && suggestions.length > 0;

  useEffect(() => {
    if (iconMode && expanded) inputRef.current?.focus();
  }, [iconMode, expanded]);

  useEffect(() => {
    if (!iconMode || !expanded) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (formRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest(".pf-v6-c-menu, .pf-v6-c-menu-toggle")) return;
      setExpanded(false);
      setSuggestionsDismissed(true);
      setActiveIndex(-1);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [iconMode, expanded]);

  const submitText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    submitLightspeedPrompt(trimmed);
    setValue("");
    setActiveIndex(-1);
    setSuggestionsDismissed(false);
  };

  const submit = () => {
    if (suggestionsOpen && activeIndex >= 0 && suggestions[activeIndex]) {
      submitText(suggestions[activeIndex]);
      return;
    }
    submitText(value);
  };

  if (iconMode && !expanded) {
    return (
      <Tooltip content="Ask OpenShift Lightspeed">
        <Button
          type="button"
          variant="plain"
          className="ocs-masthead-lightspeed-expand"
          aria-label="Ask OpenShift Lightspeed"
          aria-expanded={false}
          icon={<RobotIcon aria-hidden />}
          onClick={() => setExpanded(true)}
        />
      </Tooltip>
    );
  }

  return (
    <form
      ref={formRef}
      className="ocs-masthead-lightspeed"
      aria-label="OpenShift Lightspeed"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Button
        type="button"
        variant="plain"
        className="ocs-masthead-lightspeed__icon"
        aria-label="Hide OpenShift Lightspeed prompt"
        aria-expanded
        icon={<RobotIcon aria-hidden />}
        onClick={() => setExpanded(false)}
      />
      {showMode ? <LightspeedModeMenu compact onOpen={() => setSuggestionsDismissed(true)} /> : null}
      <input
        ref={inputRef}
        className="ocs-masthead-lightspeed__input"
        value={value}
        placeholder={placeholder}
        aria-label="Ask OpenShift Lightspeed about this cluster"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestionsOpen}
        aria-controls={SUGGEST_LIST_ID}
        aria-activedescendant={
          suggestionsOpen && activeIndex >= 0 ? `${SUGGEST_LIST_ID}-${activeIndex}` : undefined
        }
        onChange={(event) => {
          setValue(event.target.value);
          setActiveIndex(-1);
          setSuggestionsDismissed(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && suggestions.length > 0) {
            event.preventDefault();
            setSuggestionsDismissed(false);
            setActiveIndex((index) => (index + 1) % suggestions.length);
          } else if (event.key === "ArrowUp" && suggestions.length > 0) {
            event.preventDefault();
            setSuggestionsDismissed(false);
            setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
          } else if (event.key === "Escape") {
            if (suggestionsOpen) {
              setSuggestionsDismissed(true);
              setActiveIndex(-1);
            } else if (iconMode) {
              setExpanded(false);
            }
          }
        }}
        onBlur={() => {
          setSuggestionsDismissed(true);
          setActiveIndex(-1);
        }}
      />
      {suggestionsOpen ? (
        <Menu
          id={SUGGEST_LIST_ID}
          className="ocs-masthead-lightspeed__suggest"
          aria-label="AI suggestions"
          onSelect={(_event, itemId) => {
            if (typeof itemId === "string") submitText(itemId);
          }}
        >
          <MenuContent>
            <MenuGroup label="AI suggestions" labelHeadingLevel="h2">
              <MenuList>
                {suggestions.map((prompt, index) => (
                  <MenuItem
                    key={prompt}
                    itemId={prompt}
                    id={`${SUGGEST_LIST_ID}-${index}`}
                    isActive={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {prompt}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuGroup>
          </MenuContent>
        </Menu>
      ) : null}
      <Button
        type="submit"
        variant="plain"
        aria-label="Send to OpenShift Lightspeed"
        icon={<PaperPlaneIcon />}
        isDisabled={!value.trim()}
      />
    </form>
  );
}
