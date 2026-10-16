import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalHeader } from "@patternfly/react-core";
import { ConsoleYamlEditor } from "../../../components/console/ConsoleYamlEditor";
import { TopologyLightSpeedAction } from "./TopologyLightSpeedAction";
import { LightspeedAiAccuracyInline } from "../../../components/lightspeed/LightspeedLegalCopy";

type ViewYamlModalProps = {
  isOpen: boolean;
  resourceLabel: string;
  yaml: string;
  reviewContextKey?: string;
  onClose: () => void;
  onSave?: (yaml: string) => void;
};

export default function ViewYamlModal({
  isOpen,
  resourceLabel,
  yaml,
  reviewContextKey,
  onClose,
  onSave,
}: ViewYamlModalProps) {
  const [draft, setDraft] = useState(yaml);

  useEffect(() => {
    if (isOpen) {
      setDraft(yaml);
    }
  }, [isOpen, yaml]);

  const safeFilename = resourceLabel.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase() || "resource";

  const handleSave = (nextYaml: string) => {
    onSave?.(nextYaml);
    onClose();
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="view-yaml-modal-title"
      className="ocs-pf-topo-yaml-modal"
    >
      <ModalHeader title={`YAML: ${resourceLabel}`} labelId="view-yaml-modal-title" />
      <ModalBody>
        {reviewContextKey ? (
          <div className="ocs-pf-topo-yaml-modal__ai pf-v6-u-mb-md">
            <TopologyLightSpeedAction contextKey={reviewContextKey} intent="analyze" variant="link" isInline>
              Review YAML with LightSpeed
            </TopologyLightSpeedAction>
            <LightspeedAiAccuracyInline className="ocs-pf-topo-yaml-modal__disclaimer" />
          </div>
        ) : null}
        <ConsoleYamlEditor
          initialYaml={yaml}
          yaml={draft}
          onChange={setDraft}
          downloadFileName={`${safeFilename}.yaml`}
          ariaLabel={`YAML for ${resourceLabel}`}
          onSave={handleSave}
          onCancel={onClose}
        />
      </ModalBody>
    </Modal>
  );
}
