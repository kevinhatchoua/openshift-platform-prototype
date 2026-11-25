import { Button, Tooltip } from "@patternfly/react-core";
import { useChat } from "../../contexts/ChatContext";
import { OpenShiftLightspeedIcon } from "./OpenShiftLightspeedIcon";

/** Legacy panel toggle. Masthead uses {@link MastheadLightspeedBar} only (icon expands prompt; submit opens panel). */
export default function MastheadLightspeedToggle() {
  const { isOpen, setIsOpen } = useChat();
  const label = isOpen ? "Close OpenShift Lightspeed" : "Open OpenShift Lightspeed";

  return (
    <Tooltip content={label}>
      <Button
        type="button"
        variant="plain"
        className={isOpen ? "ocs-masthead-lightspeed-toggle is-open" : "ocs-masthead-lightspeed-toggle"}
        aria-pressed={isOpen}
        aria-label={label}
        icon={<OpenShiftLightspeedIcon size={24} />}
        onClick={() => setIsOpen(!isOpen)}
      />
    </Tooltip>
  );
}
