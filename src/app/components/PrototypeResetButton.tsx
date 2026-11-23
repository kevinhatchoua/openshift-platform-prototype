import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from "@patternfly/react-core";
import UndoIcon from "@patternfly/react-icons/dist/esm/icons/undo-icon";
import { resetPrototypeToDefaults } from "../lib/resetPrototypeDefaults";

/**
 * Global prototype reset in the Hub return bar (visible on every route).
 */
export default function PrototypeResetButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip content="Clear saved demo scenarios, cluster update progress, and prototype edits">
        <Button
          className="ocs-back-to-prototypes-banner__reset"
          variant="secondary"
          size="sm"
          icon={<UndoIcon aria-hidden />}
          onClick={() => setConfirmOpen(true)}
        >
          Reset prototype
        </Button>
      </Tooltip>
      <Modal
        variant="small"
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="ocs-prototype-reset-title"
      >
        <ModalHeader title="Reset prototype?" titleIconVariant="warning" id="ocs-prototype-reset-title" />
        <ModalBody>
          This restores default demo scenarios and clears cluster update progress, saved topology views, GitOps
          prototype changes, and other session data. The page will reload.
        </ModalBody>
        <ModalFooter>
          <Button key="cancel" variant="link" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            key="reset"
            variant="primary"
            onClick={() => {
              setConfirmOpen(false);
              resetPrototypeToDefaults();
            }}
          >
            Reset prototype
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}