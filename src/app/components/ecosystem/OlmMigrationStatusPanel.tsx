import { Link } from "react-router";
import {
  Alert,
  Card,
  CardBody,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Title,
} from "@patternfly/react-core";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";
import type {
  CatalogOperator,
  OlmClusterExtensionMigrationState,
} from "../../pages/ecosystem/installedOperatorsTypes";
import { InstalledOperatorMigrationStatusCell } from "./olmMigrationEligibility";

type OlmMigrationStatusPanelProps = {
  operator: CatalogOperator;
  variant: "classic" | "cluster-extension";
};

function extensionStateForOperator(
  operator: CatalogOperator,
): OlmClusterExtensionMigrationState {
  if (operator.olmClusterExtensionMigration) {
    return operator.olmClusterExtensionMigration;
  }
  return {
    installedCondition: "True",
    migrationPhase: "Succeeded",
    rollbackState: "NotApplicable",
    lastTransitionTime: operator.lastUpdated ?? "—",
    message:
      "Migration state is stored on the ClusterExtension custom resource. Console reads this if the UI pod restarts during a long migration.",
  };
}

export function OlmMigrationStatusPanel({ operator, variant }: OlmMigrationStatusPanelProps) {
  if (variant === "cluster-extension") {
    const state = extensionStateForOperator(operator);
    return (
      <Card isPlain>
        <CardBody>
          <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
            Migration status (ClusterExtension)
          </Title>
          <Content component="p" className="pf-v6-u-mb-md">
            Rollback and migration progress are persisted on the cluster extension resource, not in the
            console pod.
          </Content>
          <DescriptionList isHorizontal isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Installed</DescriptionListTerm>
              <DescriptionListDescription>{state.installedCondition}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Migration phase</DescriptionListTerm>
              <DescriptionListDescription>{state.migrationPhase}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Rollback state</DescriptionListTerm>
              <DescriptionListDescription>{state.rollbackState}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Last transition</DescriptionListTerm>
              <DescriptionListDescription>{state.lastTransitionTime}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
          {state.message ? (
            <Alert variant="info" isInline title="Prototype note" className="pf-v6-u-mt-md">
              {state.message}
            </Alert>
          ) : null}
        </CardBody>
      </Card>
    );
  }

  const showClassic =
    operator.olmMigrationActivity != null ||
    operator.olmMigrationEligibility === "migrated" ||
    operator.olmMigrationEligibility === "eligible";

  if (!showClassic) {
    return null;
  }

  const detail = operator.olmMigrationActivityDetail?.trim();

  return (
    <Card isPlain>
      <CardBody>
        <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
          Migration
        </Title>
        <DescriptionList isHorizontal isCompact className="pf-v6-u-mb-md">
          <DescriptionListGroup>
            <DescriptionListTerm>List status</DescriptionListTerm>
            <DescriptionListDescription>
              <InstalledOperatorMigrationStatusCell operator={operator} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Management</DescriptionListTerm>
            <DescriptionListDescription>
              {operator.olmMigrationEligibility === "migrated" || operator.isOlmV1Extension
                ? OLM_MODE_LABELS.nextgen
                : OLM_MODE_LABELS.classic}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {detail ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Last message</DescriptionListTerm>
              <DescriptionListDescription>{detail}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
        </DescriptionList>
        {operator.olmMigrationActivity === "failed_manual" ? (
          <Alert variant="danger" isInline title="Manual recovery may be required">
            Automatic rollback does not apply after the point of no return. Review operator conditions
            and custom resources; restore from backup if CRDs were removed.
          </Alert>
        ) : null}
        {operator.olmMigrationActivity === "failed_rollback" ? (
          <Alert variant="warning" isInline title="Migration rolled back">
            The migration library reverted management to {OLM_MODE_LABELS.classic}. Resolve blockers and
            retry from Installed Operators.
          </Alert>
        ) : null}
        <Content component="small" className="pf-v6-u-mt-md">
          <Link to="/ecosystem/installed-operators?olmTab=classic">Back to Installed Operators</Link>
        </Content>
      </CardBody>
    </Card>
  );
}
