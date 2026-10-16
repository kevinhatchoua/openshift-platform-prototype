import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { CspViolationAlert } from "../../components/security/CspViolationAlert";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { usePermissions } from "../../contexts/PermissionsContext";
import { useToast } from "../../contexts/ToastContext";
import {
  CSP_ENFORCEMENT_MODE_LABELS,
  CSP_VIOLATION_SCENARIOS,
  DEMO_ALLOW_LIST,
  type AllowListProvenance,
  type CspEnforcementMode,
  type CspViolationScenario,
} from "../../lib/cspEnforcementDemo";

type CspTab = "overview" | "allow-list" | "patterns" | "scenarios";

const PROVENANCE_LABEL: Record<AllowListProvenance, string> = {
  "upgrade-seed": "Upgrade seed",
  "platform-default": "Platform default",
  "admin-added": "Admin added",
};

export default function ContentSecurityPolicyPage() {
  const { hasAdminPermissions } = usePermissions();
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<CspTab>("overview");
  const [enforcementMode, setEnforcementMode] = useState<CspEnforcementMode>("observing");
  const [toastBurstCount, setToastBurstCount] = useState(0);
  const [suppressedSimilar, setSuppressedSimilar] = useState(0);

  const canRemediate = hasAdminPermissions;

  const triggerToast = (scenario: CspViolationScenario) => {
    if (enforcementMode === "report-only") return;
    const mode = enforcementMode;

    const nextBurst = toastBurstCount + 1;
    setToastBurstCount(nextBurst);

    if (nextBurst > 2 && nextBurst % 3 === 0) {
      setSuppressedSimilar((n) => n + 1);
      pushToast({
        variant: "warning",
        title: `CSP: ${nextBurst} similar blocks suppressed in the last minute (see notification drawer).`,
        timeout: 10000,
      });
      return;
    }

    const isWarn = mode === "observing";
    pushToast({
      variant: isWarn ? "warning" : "danger",
      title: isWarn
        ? `Would block ${scenario.directive}: ${scenario.blockedUrl}`
        : `Blocked ${scenario.directive}: ${scenario.blockedUrl}`,
      timeout: 10000,
      children: (
        <Content component="small">
          {canRemediate
            ? "Open Administration → Content security policy to review allow-list."
            : "Contact your cluster administrator with the blocked URL."}
        </Content>
      ),
    });
  };

  const modeDescription = useMemo(() => {
    switch (enforcementMode) {
      case "report-only":
        return "Violations are logged only; users do not see enforcement toasts.";
      case "observing":
        return "Users see warnings; connections are not blocked in this prototype mode.";
      case "enforcing":
        return "Blocked connections surface danger toasts with remediation when SSAR allows.";
      default:
        return "";
    }
  }, [enforcementMode]);

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto ocs-csp-page">
      <Breadcrumbs
        items={[
          { label: "Administration", path: "/administration/cluster-settings" },
          { label: "Content security policy" },
        ]}
      >
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsFlexStart" }}
          flexWrap={{ default: "wrap" }}
          gap={{ default: "gapMd" }}
          className="pf-v6-u-mb-md"
        >
          <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
            <Title headingLevel="h1" size="2xl">Content security policy</Title>
            <Content component="p" className="pf-v6-u-color-200 pf-v6-u-mb-0">
              Prototype for HPUX-2307: enforcement lifecycle, allow-list provenance, and role-aware blocked-connection UX.
            </Content>
          </Flex>
          <FavoriteButton name="Content security policy" path="/administration/content-security-policy" />
        </Flex>

        <Alert variant="info" title="Design exploration (not production behavior)" isInline className="pf-v6-u-mb-lg">
          Configuration remains ConsoleOperator CR-first for 5.x. This page explores read-only status, violation messaging,
          and rate-limited toasts. Toggle impersonation in the masthead to compare cluster admin vs developer remediation.
        </Alert>

        <Card isPlain className="pf-v6-u-mb-lg ocs-csp-page__controls">
          <CardBody>
            <Flex gap={{ default: "gapLg" }} flexWrap={{ default: "wrap" }} alignItems={{ default: "alignItemsFlexEnd" }}>
              <FormGroup label="Enforcement mode (prototype)" fieldId="csp-mode">
                <FormSelect
                  id="csp-mode"
                  aria-label="Enforcement mode"
                  value={enforcementMode}
                  onChange={(_e, v) => setEnforcementMode(v as CspEnforcementMode)}
                  className="ocs-user-preferences__field"
                >
                  {(Object.keys(CSP_ENFORCEMENT_MODE_LABELS) as CspEnforcementMode[]).map((mode) => (
                    <FormSelectOption key={mode} value={mode} label={CSP_ENFORCEMENT_MODE_LABELS[mode]} />
                  ))}
                </FormSelect>
              </FormGroup>
              <DescriptionList isCompact className="ocs-csp-page__mode-hint">
                <DescriptionListGroup>
                  <DescriptionListTerm>Effective UX</DescriptionListTerm>
                  <DescriptionListDescription>{modeDescription}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Your role (SSAR)</DescriptionListTerm>
                  <DescriptionListDescription>
                    {canRemediate ? "May remediate (cluster admin)" : "Developer: bounded guidance only"}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </Flex>
          </CardBody>
        </Card>

        <Tabs activeKey={activeTab} onSelect={(_e, k) => setActiveTab(k as CspTab)} aria-label="CSP sections">
          <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>}>
            <Card isPlain className="pf-v6-u-mt-md">
              <CardBody>
                <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">Solution directions</Title>
                <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                  <Alert variant="info" title="A. Toast + notification aggregation" isInline>
                    Surface violations as toasts with SSAR-gated links; collapse repeated targets to limit fatigue
                    ({suppressedSimilar} simulated suppressions this session).
                  </Alert>
                  <Alert variant="info" title="B. Read-only admin status (this page)" isInline>
                    Show enforcement mode, allow-list provenance, and CR documentation without a full settings UI in 5.x.
                  </Alert>
                  <Alert variant="info" title="C. Contextual inline on task flows" isInline>
                    Same alert component on Git import, Helm, and plugin flows (preview under Scenarios and Patterns tabs).
                  </Alert>
                </Flex>
              </CardBody>
            </Card>
          </Tab>

          <Tab eventKey="allow-list" title={<TabTitleText>Allow-list</TabTitleText>}>
            <Card isPlain className="pf-v6-u-mt-md">
              <CardBody>
                <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-sm">Permitted targets</Title>
                <Content component="p" className="pf-v6-u-mb-md">
                  Review before switching to enforcing. Edit via ConsoleOperator CR (API-only in 5.x).
                </Content>
                <OcsPrototypeListTable ariaLabel="CSP allow list" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
                  <Thead>
                    <Tr>
                      <Th><PlainTableHeader title="Target" /></Th>
                      <Th><PlainTableHeader title="Scope" /></Th>
                      <Th><PlainTableHeader title="Provenance" /></Th>
                      <Th><PlainTableHeader title="Rationale" /></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {DEMO_ALLOW_LIST.map((row) => (
                      <Tr key={row.id}>
                        <Td dataLabel="Target"><code>{row.target}</code></Td>
                        <Td dataLabel="Scope">{row.scope === "browser" ? "Browser (connect-src)" : "Helm server-side"}</Td>
                        <Td dataLabel="Provenance">
                          <Label isCompact color={row.provenance === "admin-added" ? "blue" : "grey"}>
                            {PROVENANCE_LABEL[row.provenance]}
                          </Label>
                        </Td>
                        <Td dataLabel="Rationale">{row.rationale}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </OcsPrototypeListTable>
              </CardBody>
            </Card>
          </Tab>

          <Tab eventKey="patterns" title={<TabTitleText>Patterns</TabTitleText>}>
            <Card isPlain className="pf-v6-u-mt-md">
              <CardBody>
                <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">Inline violation patterns</Title>
                <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
                  {CSP_VIOLATION_SCENARIOS.map((scenario) => (
                    <CspViolationAlert
                      key={scenario.id}
                      scenario={scenario}
                      canRemediate={canRemediate}
                      enforcementMode={enforcementMode === "report-only" ? "observing" : enforcementMode}
                    />
                  ))}
                </Flex>
              </CardBody>
            </Card>
          </Tab>

          <Tab eventKey="scenarios" title={<TabTitleText>Scenarios</TabTitleText>}>
            <Card isPlain className="pf-v6-u-mt-md">
              <CardBody>
                <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">Trigger prototype toasts</Title>
                <Content component="p" className="pf-v6-u-mb-md">
                  Simulates runtime CSP feedback. After the third similar event, aggregation message fires (CCSIG rate-limit concept).
                </Content>
                <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                  {CSP_VIOLATION_SCENARIOS.map((scenario) => (
                    <Button
                      key={scenario.id}
                      variant="secondary"
                      onClick={() => triggerToast(scenario)}
                      isDisabled={enforcementMode === "report-only"}
                    >
                      {scenario.label}
                    </Button>
                  ))}
                </Flex>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>

        <Card isPlain className="pf-v6-u-mt-lg" id="cr-docs">
          <CardBody>
            <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-sm">ConsoleOperator configuration</Title>
            <Content component="p">
              Short-term: enforce toggle and allow-list live on the ConsoleOperator CR (feature gate + CR fields TBD per
              CONSOLE-5551). Link design spec on HPUX-2308 when the Google Doc is published.
            </Content>
          </CardBody>
        </Card>
      </Breadcrumbs>
    </div>
  );
}
