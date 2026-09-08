import { useState } from "react";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "@patternfly/react-core";
import { useToast } from "../../contexts/ToastContext";

type GitOpsConnectAgentModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GitOpsConnectAgentModal({ isOpen, onClose }: GitOpsConnectAgentModalProps) {
  const { pushToast } = useToast();
  const [cluster, setCluster] = useState("spoke-lab");
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="connect-agent-title">
      <ModalHeader title="Connect agent" titleIconVariant="info" labelId="connect-agent-title" />
      <ModalBody>
        <Alert
          variant="info"
          isInline
          title="Registration tokens and TLS material are never displayed in the console."
          className="pf-v6-u-mb-md"
        />
        <Form>
          <FormGroup label="Cluster name" isRequired fieldId="agent-cluster">
            <TextInput id="agent-cluster" value={cluster} onChange={(_e, v) => setCluster(v)} />
          </FormGroup>
          <FormGroup label="Hub instance" fieldId="agent-hub">
            <TextInput id="agent-hub" value="openshift-gitops/openshift-gitops" isReadOnly />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button key="connect" variant="primary" onClick={() => {
          pushToast({ variant: "success", title: `Agent registration started for ${cluster}.` });
          onClose();
        }}>
          Connect
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
