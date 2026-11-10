import { type MouseEvent, type ReactNode, useState } from "react";
import { Link } from "react-router";
import {
  Alert,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Icon,
  Label,
  MenuToggle,
  Tooltip,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import { RhAiExperienceIcon } from "@/components/icons/RhAiExperienceIcon";
import HeartBrokenIcon from "@patternfly/react-icons/dist/esm/icons/heart-broken-icon";
import HeartIcon from "@patternfly/react-icons/dist/esm/icons/heart-icon";
import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import PauseIcon from "@patternfly/react-icons/dist/esm/icons/pause-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import type { GitOpsHealth, GitOpsOwner, OwnerReference } from "./gitopsData";
import { GITOPS_APPLICATION_SETS, gitopsDetailPath } from "./gitopsData";
import FavoriteButton from "../../components/FavoriteButton";
import { useToast } from "../../contexts/ToastContext";
import { gitOpsHealthLabelColor, gitOpsSyncLabelColor } from "../../lib/pfSemanticColors";
import {
  GITOPS_VIEW_AGENTIC_RUN_LABEL,
  GITOPS_VIEW_AGENTIC_RUN_TOOLTIP,
} from "./gitopsAgenticCopy";

export const GITOPS_VIEW_AGENTIC_RUN_ID = "view-agentic-run";

export type GitOpsActionItem = {
  id: string;
  label: string;
  isDanger?: boolean;
  /** When true, selection is handled via onItemSelect only (no prototype edit/delete toast). */
  prototypeOnly?: boolean;
};

export type GitOpsBreadcrumbItem = { label: string; path?: string };

/** Console-style detail breadcrumb: e.g. Applications → Application details */
export function gitopsConsoleDetailCrumbs(
  listLabel: "Applications" | "ApplicationSets" | "AppProjects",
  listPath: string
): GitOpsBreadcrumbItem[] {
  const detailLabel =
    listLabel === "Applications"
      ? "Application details"
      : listLabel === "ApplicationSets"
        ? "ApplicationSet details"
        : "AppProject details";
  return [{ label: listLabel, path: listPath }, { label: detailLabel }];
}

/** Primary CTA for GITOPS-11005 — deep link to shared AgenticRun details (not chat). */
export function ViewAgenticRunButton({
  onClick,
  className,
}: {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  const link = (
    <Button
      variant="link"
      isInline
      className={className ?? "ocs-gitops-health-remediation-link"}
      icon={<RhAiExperienceIcon aria-hidden />}
      onClick={onClick}
    >
      {GITOPS_VIEW_AGENTIC_RUN_LABEL}
    </Button>
  );

  return (
    <Tooltip content={GITOPS_VIEW_AGENTIC_RUN_TOOLTIP}>
      <span className="ocs-gitops-agentic-run-link-wrap">{link}</span>
    </Tooltip>
  );
}

export function GitOpsTechPreviewBadge() {
  return (
    <Label color="orange" isCompact>
      Tech preview
    </Label>
  );
}

export function GitOpsDetailPageHeader({
  kind,
  name,
  href,
  menuKind,
  agenticOnSelect,
}: {
  kind: string;
  name: string;
  href: string;
  menuKind: string;
  /** When set, kebab includes View Agentic Run (GITOPS-11005). */
  agenticOnSelect?: () => void;
}) {
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      justifyContent={{ default: "justifyContentSpaceBetween" }}
      flexWrap={{ default: "wrap" }}
      gap={{ default: "gapMd" }}
    >
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
        <ResourceName kind={kind} name={name} />
        <GitOpsTechPreviewBadge />
      </Flex>
      <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
        <FavoriteButton name={name} path={href} />
        <GitOpsEditDeleteMenu kind={menuKind} name={name} variant="secondary" agenticOnSelect={agenticOnSelect} />
      </Flex>
    </Flex>
  );
}

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
        <Button
          variant="link"
          isInline
          component={Link}
          to={to}
          onClick={(e) => e.stopPropagation()}
        >
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

export function HealthStatus({
  status,
  showAiRemediation = false,
  onAiRemediationClick,
}: {
  status: GitOpsHealth | "Synced" | "OutOfSync" | string;
  showAiRemediation?: boolean;
  onAiRemediationClick?: (event: MouseEvent) => void;
}) {
  if (status === "Healthy") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon className="ocs-gitops-health-icon ocs-gitops-health-icon--healthy" aria-hidden>
          <HeartIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "Synced") {
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
        <Icon className="ocs-gitops-health-icon ocs-gitops-health-icon--paused" aria-hidden>
          <PauseIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "Progressing") {
    return (
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Icon status="info" aria-hidden>
          <InProgressIcon />
        </Icon>
        <span>{status}</span>
      </Flex>
    );
  }
  if (status === "OutOfSync") {
    return (
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsFlexStart" }}>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="warning" aria-hidden>
            <SyncIcon />
          </Icon>
          <span>{status}</span>
        </Flex>
        {showAiRemediation ? (
          <ViewAgenticRunButton
            onClick={(event) => {
              event.stopPropagation();
              onAiRemediationClick?.(event);
            }}
          />
        ) : null}
      </Flex>
    );
  }
  if (status === "Degraded") {
    return (
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsFlexStart" }}>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon className="ocs-gitops-health-icon ocs-gitops-health-icon--degraded" aria-hidden>
            <HeartBrokenIcon />
          </Icon>
          <span>{status}</span>
        </Flex>
        {showAiRemediation ? (
          <ViewAgenticRunButton
            onClick={(event) => {
              event.stopPropagation();
              onAiRemediationClick?.(event);
            }}
          />
        ) : null}
      </Flex>
    );
  }
  if (status === "Aborting") {
    return (
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsFlexStart" }}>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="danger" aria-hidden>
            <ExclamationCircleIcon />
          </Icon>
          <span>{status}</span>
        </Flex>
        {showAiRemediation ? (
          <ViewAgenticRunButton
            onClick={(event) => {
              event.stopPropagation();
              onAiRemediationClick?.(event);
            }}
          />
        ) : null}
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
  agenticOnSelect,
  showResourceActions = true,
}: {
  kind: string;
  name: string;
  variant?: "plain" | "secondary";
  extraItems?: GitOpsActionItem[];
  onItemSelect?: (actionId: string) => void;
  agenticOnSelect?: () => void;
  /** When false, kebab is contextual actions only (e.g. dashboard row). */
  showResourceActions?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { pushToast } = useToast();
  const items: GitOpsActionItem[] = [
  ...(agenticOnSelect
    ? [{ id: GITOPS_VIEW_AGENTIC_RUN_ID, label: GITOPS_VIEW_AGENTIC_RUN_LABEL, prototypeOnly: true as const }]
    : []),
    ...extraItems,
    ...(showResourceActions
      ? [
          { id: "edit", label: `Edit ${kind}` },
          { id: "delete", label: `Delete ${kind}`, isDanger: true as const },
        ]
      : []),
  ];
  if (items.length === 0) {
    return null;
  }
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
              setOpen(false);
              if (item.id === GITOPS_VIEW_AGENTIC_RUN_ID) {
                agenticOnSelect?.();
                return;
              }
              onItemSelect?.(item.id);
              if (item.prototypeOnly) {
                return;
              }
              pushToast({
                variant: item.isDanger ? "danger" : "success",
                title: `${item.label}: ${name}`,
              });
            }}
          >
            {item.id === GITOPS_VIEW_AGENTIC_RUN_ID ? (
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <RhAiExperienceIcon aria-hidden />
                <span>{item.label}</span>
              </Flex>
            ) : (
              item.label
            )}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}
