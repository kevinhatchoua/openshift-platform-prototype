import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import {
  ALL_NAMESPACES,
  CLUSTER_NAMESPACES,
  getServiceAccountsForNamespace,
  isConcreteNamespace,
  resolveNamespaceForServiceAccount,
} from "../data/impersonationMockData";
import TypeaheadSelect from "./TypeaheadSelect";

type ImpersonateKind = "User" | "ServiceAccount";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface ImpersonateUserModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onImpersonate: (user: User) => void;
  /** Optional prefill when opened from a user row action */
  preselectedUser?: User | null;
  /** Kept for call-site compatibility; not used in this production-aligned mock */
  users?: User[];
}

function buildServiceAccountIdentity(namespace: string, name: string) {
  return `system:serviceaccount:${namespace.trim()}:${name.trim()}`;
}

export default function ImpersonateUserModal({
  isOpen = true,
  onClose,
  onImpersonate,
  preselectedUser = null,
}: ImpersonateUserModalProps) {
  const [kind, setKind] = useState<ImpersonateKind>("User");
  const [username, setUsername] = useState("");
  const [groups, setGroups] = useState("");
  const [namespace, setNamespace] = useState(ALL_NAMESPACES);
  const [saName, setSaName] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setKind("User");
      setUsername("");
      setGroups("");
      setNamespace(ALL_NAMESPACES);
      setSaName("");
      return;
    }
    if (preselectedUser) {
      setKind("User");
      setUsername(preselectedUser.name);
    }
  }, [isOpen, preselectedUser]);

  // Dependent filtering: namespace change clears trailing SA selection instantly
  const handleNamespaceChange = (selectedNamespace: string) => {
    setNamespace(selectedNamespace || ALL_NAMESPACES);
    setSaName("");
  };

  const namespaceOptions = useMemo(() => [ALL_NAMESPACES, ...CLUSTER_NAMESPACES], []);
  const saOptions = useMemo(() => getServiceAccountsForNamespace(namespace), [namespace]);

  const resolvedSaNamespace = useMemo(() => {
    if (!saName.trim()) {
      return null;
    }
    if (isConcreteNamespace(namespace)) {
      return namespace;
    }
    return resolveNamespaceForServiceAccount(saName);
  }, [namespace, saName]);

  const constructedSaName = useMemo(() => {
    if (!resolvedSaNamespace || !saName.trim()) {
      return "";
    }
    return buildServiceAccountIdentity(resolvedSaNamespace, saName);
  }, [resolvedSaNamespace, saName]);

  const canSubmit =
    kind === "User" ? username.trim().length > 0 : Boolean(resolvedSaNamespace && saName.trim());

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    if (kind === "ServiceAccount") {
      if (!resolvedSaNamespace) {
        return;
      }
      const identity = buildServiceAccountIdentity(resolvedSaNamespace, saName);
      onImpersonate({
        id: identity,
        name: identity,
        email: `${saName.trim()}@${resolvedSaNamespace}`,
        role: "Service Account",
        department: resolvedSaNamespace,
      });
    } else {
      onImpersonate({
        id: username.trim(),
        name: username.trim(),
        email: "",
        role: "User",
        department: groups
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
          .join(", "),
      });
    }
    onClose();
  };

  const alertText =
    kind === "User"
      ? "Impersonating a user grants you their exact permissions. You must enter username, but you can also enter a group to simulate the permissions of a member of that group."
      : "Impersonating a service account grants you that service account's permissions. Choose a namespace, then a service account — the console constructs the Kubernetes identity for you.";

  return (
    <Modal
      variant="small"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="impersonate-modal-title"
      aria-describedby="impersonate-modal-description"
    >
      <ModalHeader labelId="impersonate-modal-title" title="Impersonate" />
      <ModalBody id="impersonate-modal-description">
        <Form>
          <Alert variant="warning" isInline title={alertText} />

          <FormGroup label="Impersonate as" fieldId="impersonate-kind">
            <ToggleGroup aria-label="Impersonation subject type" isFill>
              <ToggleGroupItem
                text="User"
                buttonId="impersonate-kind-user"
                isSelected={kind === "User"}
                onChange={() => setKind("User")}
              />
              <ToggleGroupItem
                text="Service Account"
                buttonId="impersonate-kind-sa"
                isSelected={kind === "ServiceAccount"}
                onChange={() => {
                  setKind("ServiceAccount");
                  setNamespace(ALL_NAMESPACES);
                  setSaName("");
                }}
              />
            </ToggleGroup>
          </FormGroup>

          {kind === "User" ? (
            <>
              <FormGroup label="Username" isRequired fieldId="impersonate-username">
                <TextInput
                  id="impersonate-username"
                  value={username}
                  onChange={(_e, value) => setUsername(value)}
                  placeholder="Enter a username"
                  aria-label="Username"
                />
              </FormGroup>
              <FormGroup label="Groups" fieldId="impersonate-groups">
                <TextInput
                  id="impersonate-groups"
                  value={groups}
                  onChange={(_e, value) => setGroups(value)}
                  placeholder="Enter groups"
                  aria-label="Groups"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>Optional. Comma-separated group names.</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            </>
          ) : (
            <>
              <FormGroup label="Namespace" isRequired fieldId="impersonate-sa-namespace">
                <TypeaheadSelect
                  id="impersonate-sa-namespace"
                  aria-label="Namespace"
                  options={namespaceOptions}
                  value={namespace}
                  onChange={handleNamespaceChange}
                  placeholder="Select a namespace"
                />
              </FormGroup>
              <FormGroup label="Service account name" isRequired fieldId="impersonate-sa-name">
                <TypeaheadSelect
                  id="impersonate-sa-name"
                  aria-label="Service account name"
                  options={saOptions}
                  value={saName}
                  onChange={setSaName}
                  placeholder="Select a service account"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Service account name depends on selected Namespace.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
              {constructedSaName ? (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Will impersonate as <code>{constructedSaName}</code>
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              ) : null}
            </>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button key="impersonate" variant="primary" onClick={handleSubmit} isDisabled={!canSubmit}>
          Impersonate
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
