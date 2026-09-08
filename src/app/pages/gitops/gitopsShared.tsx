import { type ReactNode, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Icon,
  Label,
  MenuToggle,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import type { GitOpsHealth, GitOpsOwner, OwnerReference } from "./gitopsData";
import { GITOPS_APPLICATION_SETS, gitopsDetailPath } from "./gitopsData";
import { useToast } from "../../contexts/ToastContext";
import { gitOpsHealthLabelColor, gitOpsSyncLabelColor } from "../../lib/pfSemanticColors";

export type GitOpsActionItem = {
  id: string;
  label: string;
  isDanger?: boolean;
};

const KIND_ABBREV: Record<string, string> = {
  Application: "A",
  ApplicationSet: "AS",
  Rollout: "AR",
  ReplicaSet: "RS",
  Pod: "P",
  Namespace: "NS",
  ArgoCD: "AC",
  AppProject: "AP",
  ImageUpdater: "IU",
  Agent: "AG",
  Promotion: "PR",
};

const KIND_COLOR: Record<string, "blue" | "green" | "teal" | "purple" | "orange" | "grey"> = {
  Application: "blue",
  ApplicationSet: "purple",
  Rollout: "orange",
  ReplicaSet: "blue",
  Pod: "teal",
  Namespace: "green",
  ArgoCD: "orange",
  AppProject: "teal",
  ImageUpdater: "purple",
  Agent: "green",
  Promotion: "blue",
};

export function ResourceName({
  kind,
  name,
  to,
}: {
  kind: string;
  name: string;
  to?: string | null;
}) {
  const abbrev = KIND_ABBREV[kind] ?? kind.slice(0, 2).toUpperCase();
  const color = KIND_COLOR[kind] ?? "grey";
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapSm" }}
      flexWrap={{ default: "nowrap" }}
    >
      <Label color={color} isCompact className="ocs-resource-label">
        {abbrev}
      </Label>
      {to ? (
        <Button variant="link" isInline component={Link} to={to}>
          {name}
        </Button>
      ) : (
        <span>{name}</span>
      )}
    </Flex>
  );
}

export function GitOpsLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="pf-v6-c-button pf-m-link pf-m-inline" onClick={(e) => e.stopPropagation()}>
      {children}
    </Link>
  );
}

export function ownerReferenceDetailPath(ref: OwnerReference, fallbackNs: string): string | null {
  if (ref.kind === "Application") {
    return gitopsDetailPath("applications", fallbackNs, ref.name);
  }
  if (ref.kind === "ApplicationSet") {
    const appset = GITOPS_APPLICATION_SETS.find((a) => a.name === ref.name);
    return gitopsDetailPath("applicationsets", appset?.ns ?? fallbackNs, ref.name);
  }
  if (ref.kind === "Rollout") {
    return gitopsDetailPath("rollouts", fallbackNs, ref.name);
  }
  return null;
}

export function OwnerReferencesCell({
  refs,
  ns,
}: {
  refs: OwnerReference[];
  ns: string;
}) {
  if (!refs.length) return <span className="pf-v6-u-color-200">—</span>;
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
      {refs.map((ref) => (
        <ResourceName
          key={`${ref.kind}/${ref.name}/${ref.uid ?? ""}`}
          kind={ref.kind}
          name={ref.name}
          to={ownerReferenceDetailPath(ref, ns)}
        />
      ))}
    </Flex>
  );
}

export function ManagedByCell({ owner }: { owner: GitOpsOwner }) {
  if (!owner) return <span className="pf-v6-u-color-200">—</span>;
  const to =
    owner.kind === "Application"
      ? gitopsDetailPath("applications", owner.ns ?? "argocd", owner.name)
      : owner.kind === "ApplicationSet"
        ? gitopsDetailPath("applicationsets", owner.ns ?? "argocd", owner.name)
        : owner.kind === "Rollout"
          ? gitopsDetailPath("rollouts", owner.ns ?? "argocd", owner.name)
          : null;
  return <ResourceName kind={owner.kind} name={owner.name} to={to} />;
}

export function HealthStatus({ status }: { status: GitOpsHealth | "Synced" | "OutOfSync" | string }) {
  if (status === "Healthy" || status === "Synced") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="success" aria-hidden>
          <CheckCircleIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "Paused") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Label color={gitOpsHealthLabelColor(status)} isCompact>{status}</Label>
      </Flex>
    );
  }
  if (status === "Progressing") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Label color={gitOpsHealthLabelColor(status)} isCompact>{status}</Label>
      </Flex>
    );
  }
  if (status === "OutOfSync") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="warning" aria-hidden>
          <SyncIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "Degraded" || status === "Aborting") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="danger" aria-hidden>
          <ExclamationCircleIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  return <span>{status}</span>;
}

export function SyncStatusLabel({ sync }: { sync: string }) {
  return <Label color={gitOpsSyncLabelColor(sync)} isCompact>{sync}</Label>;
}

export function HealthStatusLabel({ health }: { health: string }) {
  return <Label color={gitOpsHealthLabelColor(health)} isCompact>{health}</Label>;
}

export function InfoLabel({ text, color }: { text: string; color: "green" | "blue" | "purple" | "grey" | "red" }) {
  return (
    <Label color={color} isCompact>
      {text}
    </Label>
  );
}

export function GitOpsEditDeleteMenu({
  kind,
  name,
  variant = "plain",
  extraItems = [],
  onItemSelect,
}: {
  kind: string;
  name: string;
  variant?: "plain" | "secondary";
  extraItems?: GitOpsActionItem[];
  onItemSelect?: (actionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { pushToast } = useToast();
  const items: GitOpsActionItem[] = [
    ...extraItems,
    { id: "edit", label: `Edit ${kind}` },
    { id: "delete", label: `Delete ${kind}`, isDanger: true },
  ];
  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      onSelect={() => setOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant={variant}
          aria-label={`Actions for ${kind} ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          isExpanded={open}
        >
          {variant === "plain" ? <EllipsisVIcon /> : "Actions"}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {items.map((item) => (
          <DropdownItem
            key={item.id}
            itemId={item.id}
            isDanger={item.isDanger}
            onClick={(e) => {
              e.stopPropagation();
              onItemSelect?.(item.id);
              pushToast({
                variant: item.isDanger ? "danger" : "success",
                title: `${item.label}: ${name}`,
              });
            }}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}
