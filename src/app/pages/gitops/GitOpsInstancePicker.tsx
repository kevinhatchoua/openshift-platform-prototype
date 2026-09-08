import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Divider, MenuToggle, Select, SelectList, SelectOption } from "@patternfly/react-core";
import CheckIcon from "@patternfly/react-icons/dist/esm/icons/check-icon";
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon";
import { ARGO_INSTANCES, GITOPS_ALL_INSTANCES, instanceKeyOf } from "./gitopsData";

const STORAGE_KEY = "ocs-gitops-instance";

function isValidKey(key: string) {
  if (key === GITOPS_ALL_INSTANCES) return true;
  return ARGO_INSTANCES.some((a) => instanceKeyOf(a) === key);
}

function readStoredInstance(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidKey(stored)) return stored;
    if (stored) {
      const byName = ARGO_INSTANCES.find((a) => a.name === stored);
      if (byName) return instanceKeyOf(byName);
    }
  } catch {
    /* ignore */
  }
  return GITOPS_ALL_INSTANCES;
}

function resolveInitialInstance(urlInstance: string | null): string {
  if (urlInstance && isValidKey(urlInstance)) return urlInstance;
  return readStoredInstance();
}

export function useGitOpsInstance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlInstance = searchParams.get("instance");
  const [instance, setInstanceState] = useState(() => resolveInitialInstance(urlInstance));

  useEffect(() => {
    if (urlInstance && isValidKey(urlInstance)) {
      setInstanceState(urlInstance);
    }
  }, [urlInstance]);

  const setInstance = useCallback(
    (name: string) => {
      if (!isValidKey(name)) return;
      setInstanceState(name);
      try {
        localStorage.setItem(STORAGE_KEY, name);
      } catch {
        /* ignore */
      }
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (name === GITOPS_ALL_INSTANCES) next.delete("instance");
          else next.set("instance", name);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { instance, setInstance, instances: ARGO_INSTANCES };
}

function labelFor(key: string) {
  if (key === GITOPS_ALL_INSTANCES) return "All Instances";
  return key;
}

export default function GitOpsInstancePicker({
  className,
  instance: instanceProp,
  setInstance: setInstanceProp,
}: {
  className?: string;
  instance?: string;
  setInstance?: (name: string) => void;
}) {
  const internal = useGitOpsInstance();
  const instance = instanceProp ?? internal.instance;
  const setInstance = setInstanceProp ?? internal.setInstance;
  const instances = internal.instances;
  const [open, setOpen] = useState(false);

  return (
    <Select
      id="gitops-instance-picker"
      className={className}
      isOpen={open}
      selected={instance}
      onSelect={(_e, value) => {
        setInstance(String(value));
        setOpen(false);
      }}
      onOpenChange={(isOpen) => setOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setOpen((o) => !o)}
          isExpanded={open}
          icon={<ServerIcon />}
          aria-label="Argo CD instance"
        >
          {labelFor(instance)}
        </MenuToggle>
      )}
    >
      <SelectList>
        <SelectOption
          value={GITOPS_ALL_INSTANCES}
          isSelected={instance === GITOPS_ALL_INSTANCES}
          icon={instance === GITOPS_ALL_INSTANCES ? <CheckIcon /> : undefined}
        >
          All Instances
        </SelectOption>
        <Divider component="li" />
        {instances.map((argo) => {
          const key = instanceKeyOf(argo);
          return (
            <SelectOption
              key={key}
              value={key}
              isSelected={instance === key}
              icon={instance === key ? <CheckIcon /> : undefined}
              description={`${argo.applications} applications · ${argo.status}`}
            >
              {key}
            </SelectOption>
          );
        })}
      </SelectList>
    </Select>
  );
}
