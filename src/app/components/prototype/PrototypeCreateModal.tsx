import { useEffect, useState } from "react";
import { Button, Flex, FlexItem, Modal, ModalBody, ModalFooter, ModalHeader } from "@patternfly/react-core";
import {
  ConsoleYamlEditor,
  CONSOLE_YAML_ACTIONS_CREATE,
} from "../console/ConsoleYamlEditor";

type PrototypeCreateModalProps = {
  isOpen: boolean;
  resourceLabel: string;
  yaml: string;
  onClose: () => void;
  onCreate: (yaml: string) => void;
};

export default function PrototypeCreateModal({
  isOpen,
  resourceLabel,
  yaml,
  onClose,
  onCreate,
}: PrototypeCreateModalProps) {
  const [draft, setDraft] = useState(yaml);

  useEffect(() => {
    if (isOpen) {
      setDraft(yaml);
    }
  }, [isOpen, yaml]);

  const safeFilename = resourceLabel.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase() || "resource";

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="prototype-create-modal-title"
      className="ocs-pf-topo-yaml-modal"
    >
      <ModalHeader title={`Create ${resourceLabel}`} labelId="prototype-create-modal-title" />
      <ModalBody>
        <ConsoleYamlEditor
          initialYaml={yaml}
          yaml={draft}
          onChange={setDraft}
          actions={CONSOLE_YAML_ACTIONS_CREATE}
          downloadFileName={`${safeFilename}.yaml`}
          ariaLabel={`${resourceLabel} YAML`}
        />
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent={{ default: "justifyContentFlexEnd" }} gap={{ default: "gapSm" }}>
          <FlexItem>
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
          </FlexItem>
          <FlexItem>
            <Button variant="primary" onClick={() => onCreate(draft)}>
              Create
            </Button>
          </FlexItem>
        </Flex>
      </ModalFooter>
    </Modal>
  );
}
