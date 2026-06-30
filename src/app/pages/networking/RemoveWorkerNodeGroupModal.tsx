import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

export type WorkerNodeRemovalTarget = {
  id: string;
  shortName: string;
  hostname: string;
};

type RemoveWorkerNodeGroupModalProps = {
  target: WorkerNodeRemovalTarget | null;
  onClose: () => void;
  onConfirm: (workerId: string) => void;
};

export function RemoveWorkerNodeGroupModal({ target, onClose, onConfirm }: RemoveWorkerNodeGroupModalProps) {
  const isOpen = target !== null;

  return (
    <Modal variant="small" isOpen={isOpen} onClose={onClose} aria-labelledby="remove-worker-node-modal-title">
      <ModalHeader
        title="Remove worker node from topology?"
        labelId="remove-worker-node-modal-title"
      />
      <ModalBody>
        <Content component="p">
          Removing <strong>{target?.shortName}</strong> ({target?.hostname}) hides its worker node group from the
          canvas. Network assignments to this node are cleared. The node itself is not deleted from the cluster.
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (target) onConfirm(target.id);
            onClose();
          }}
        >
          Remove from topology
        </Button>
      </ModalFooter>
    </Modal>
  );
}
