import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
} from "@patternfly/react-core";
import type { SubscriptionChannelCatalog } from "./installedOperatorSubscriptionState";

type UpdateChannelModalProps = {
  isOpen: boolean;
  channel: string;
  version: string;
  catalog: SubscriptionChannelCatalog;
  onClose: () => void;
  onSave: (channel: string, version: string) => void;
};

export function UpdateChannelModal({
  isOpen,
  channel,
  version,
  catalog,
  onClose,
  onSave,
}: UpdateChannelModalProps) {
  const [draftChannel, setDraftChannel] = useState(channel);
  const [draftVersion, setDraftVersion] = useState(version);

  const channelOptions = useMemo(() => Object.keys(catalog).sort(), [catalog]);

  const versionOptions = useMemo(() => {
    const versions = catalog[draftChannel]?.versions ?? [version];
    return [...versions].sort();
  }, [catalog, draftChannel, version]);

  useEffect(() => {
    if (!isOpen) return;
    setDraftChannel(channel);
    setDraftVersion(version);
  }, [isOpen, channel, version]);

  useEffect(() => {
    if (!versionOptions.includes(draftVersion)) {
      setDraftVersion(versionOptions[versionOptions.length - 1] ?? draftVersion);
    }
  }, [draftChannel, versionOptions, draftVersion]);

  const canSave = draftChannel.trim().length > 0 && draftVersion.trim().length > 0;

  return (
    <Modal variant="small" isOpen={isOpen} onClose={onClose} aria-labelledby="sub-edit-channel-title">
      <ModalHeader title={<span id="sub-edit-channel-title">Change Subscription update channel</span>} />
      <ModalBody>
        <p className="pf-v6-u-mb-md">Which channel is used to receive updates?</p>
        <Form>
          <FormGroup label="Update channel" isRequired fieldId="sub-edit-channel">
            <FormSelect
              id="sub-edit-channel"
              value={draftChannel}
              onChange={(_e, v) => setDraftChannel(v)}
              aria-label="Update channel"
            >
              {channelOptions.map((ch) => (
                <FormSelectOption key={ch} value={ch} label={ch} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Version" isRequired fieldId="sub-edit-version">
            <FormSelect
              id="sub-edit-version"
              value={draftVersion}
              onChange={(_e, v) => setDraftVersion(v)}
              aria-label="Version"
            >
              {versionOptions.map((v) => (
                <FormSelectOption key={v} value={v} label={v} />
              ))}
            </FormSelect>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          isDisabled={!canSave}
          onClick={() => {
            onSave(draftChannel, draftVersion);
            onClose();
          }}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}

type UpdateApproval = "Automatic" | "Manual";

type UpdateApprovalModalProps = {
  isOpen: boolean;
  approval: UpdateApproval;
  onClose: () => void;
  onSave: (approval: UpdateApproval) => void;
};

export function UpdateApprovalModal({
  isOpen,
  approval,
  onClose,
  onSave,
}: UpdateApprovalModalProps) {
  const [draft, setDraft] = useState<UpdateApproval>(approval);

  useEffect(() => {
    if (isOpen) setDraft(approval);
  }, [isOpen, approval]);

  return (
    <Modal variant="small" isOpen={isOpen} onClose={onClose} aria-labelledby="sub-edit-approval-title">
      <ModalHeader title={<span id="sub-edit-approval-title">Change update approval strategy</span>} />
      <ModalBody>
        <p className="pf-v6-u-mb-md">What strategy is used for approving updates?</p>
        <Form>
          <FormGroup fieldId="sub-edit-approval">
            <Radio
              id="sub-approval-automatic"
              name="sub-approval"
              label="Automatic (default)"
              description="New updates will be installed as soon as they become available."
              isChecked={draft === "Automatic"}
              onChange={() => setDraft("Automatic")}
            />
            <Radio
              id="sub-approval-manual"
              name="sub-approval"
              className="pf-v6-u-mt-md"
              label="Manual"
              description="New updates need to be manually approved before installation begins."
              isChecked={draft === "Manual"}
              onChange={() => setDraft("Manual")}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => { onSave(draft); onClose(); }}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}
