import type { ReactNode } from "react";
import {
  Alert,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  Flex,
  FormSelect,
  FormSelectOption,
  Title,
} from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import { OlmClassicExperienceBanner } from "./ecosystem/OlmClassicExperienceBanner";
import { CatalogBrandLogo } from "../pages/ecosystem/CatalogBrandLogo";
import type { LogoCatalogType } from "../pages/ecosystem/catalogLogos";

function InlineCode({ children }: { children: ReactNode }) {
  return <code className="ocs-catalog-detail__code">{children}</code>;
}

export type CatalogDetailItem = {
  id: string;
  name: string;
  provider: string;
  providerType: string;
  description: string;
  installed: boolean;
  hasUpdate?: boolean;
  newVersion?: string;
  currentVersion?: string;
  catalogType: string;
  typeLabel: string;
};

type CatalogOperatorDetailPanelProps = {
  item: CatalogDetailItem;
  /** Classic (OLMv0) catalog shows channel/version selectors; Next-Gen uses ClusterExtension create flow. */
  olmVersion?: "v0" | "v1";
  onClose: () => void;
  onInstall?: () => void;
  onCreate?: () => void;
  onUpdate?: () => void;
  onViewDetails?: () => void;
};

export default function CatalogOperatorDetailPanel({
  item,
  olmVersion = "v0",
  onClose,
  onInstall,
  onCreate,
  onUpdate,
  onViewDetails,
}: CatalogOperatorDetailPanelProps) {
  const isOperator = item.catalogType === "operators";
  const isOlmV1Operator = isOperator && olmVersion === "v1";
  const showPrimaryAction = !item.installed && (isOperator ? onInstall : onCreate);

  return (
    <>
      <DrawerHead className="ocs-catalog-detail__head">
        <Flex
          direction={{ default: "column" }}
          gap={{ default: "gapMd" }}
          flex={{ default: "flex_1" }}
          className="ocs-catalog-detail__head-main"
        >
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flex={{ default: "flex_1" }}>
            <CatalogBrandLogo
              id={item.id}
              displayName={item.name}
              catalogType={item.catalogType as LogoCatalogType}
              boxClassName="ocs-catalog-detail__logo"
              logoClassName="ocs-catalog-detail__logo-img"
            />
            <Flex direction={{ default: "column" }} flex={{ default: "flex_1" }}>
              <Title headingLevel="h2" size="xl">
                {item.name}
              </Title>
              <Content component="small">Provided by {item.provider}</Content>
            </Flex>
          </Flex>
          {showPrimaryAction ? (
            <div className="ocs-catalog-detail__head-actions">
              {isOperator ? (
                <Button variant="primary" onClick={onInstall}>
                  {isOlmV1Operator ? "Install" : "Install"}
                </Button>
              ) : (
                <Button variant="primary" onClick={onCreate}>
                  Create
                </Button>
              )}
            </div>
          ) : null}
        </Flex>
        <DrawerActions>
          <DrawerCloseButton onClose={onClose} />
        </DrawerActions>
      </DrawerHead>
      <Divider />

      <DrawerPanelBody>
        {isOperator ? <OlmClassicExperienceBanner /> : null}
        {isOperator && item.hasUpdate ? (
          <Alert
            variant="warning"
            isInline
            title="Update available"
            className="pf-v6-u-mb-md"
            customActions={
              <Button variant="link" isInline onClick={onUpdate}>
                Review update
              </Button>
            }
          >
            Version {item.newVersion} is ready to be installed.
          </Alert>
        ) : null}

        <div className="ocs-catalog-detail__grid">
          <aside className="ocs-catalog-detail__meta" aria-label="Catalog item metadata">
            <DescriptionList isCompact>
              {isOperator ? (
                <>
                  {isOlmV1Operator ? (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Install method</DescriptionListTerm>
                      <DescriptionListDescription>
                        Cluster extension. Channel and version are entered during install.
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ) : (
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Channel</DescriptionListTerm>
                        <DescriptionListDescription>
                          <FormSelect aria-label="Channel" defaultValue="stable">
                            <FormSelectOption value="stable" label="stable" />
                            <FormSelectOption value="release-2-16" label="release-2.16" />
                            <FormSelectOption value="fast" label="fast" />
                          </FormSelect>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Version</DescriptionListTerm>
                        <DescriptionListDescription>
                          <FormSelect
                            aria-label="Version"
                            defaultValue={item.currentVersion ?? item.newVersion ?? "2.16.0"}
                          >
                            <FormSelectOption
                              value={item.currentVersion ?? "2.16.0"}
                              label={item.currentVersion ?? "2.16.0"}
                            />
                            {item.newVersion ? (
                              <FormSelectOption value={item.newVersion} label={item.newVersion} />
                            ) : null}
                          </FormSelect>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </>
                  )}
                  <DescriptionListGroup>
                    <DescriptionListTerm>Capability level</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ul className="ocs-catalog-detail__capabilities">
                        {[
                          { label: "Basic Install", done: true },
                          { label: "Seamless Upgrades", done: true },
                          { label: "Full Lifecycle", done: false },
                          { label: "Deep Insights", done: false },
                          { label: "Auto Pilot", done: false },
                        ].map((cap) => (
                          <li key={cap.label}>
                            {cap.done ? (
                              <CheckCircleIcon aria-hidden className="ocs-catalog-detail__cap-icon" />
                            ) : (
                              <span className="ocs-catalog-detail__cap-empty" aria-hidden />
                            )}
                            {cap.label}
                          </li>
                        ))}
                      </ul>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              ) : (
                <DescriptionListGroup>
                  <DescriptionListTerm>Type</DescriptionListTerm>
                  <DescriptionListDescription>{item.typeLabel}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>Source</DescriptionListTerm>
                <DescriptionListDescription>{item.providerType}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Provider</DescriptionListTerm>
                <DescriptionListDescription>{item.provider}</DescriptionListDescription>
              </DescriptionListGroup>
              {isOperator ? (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Infrastructure features</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ul className="ocs-catalog-detail__bullets">
                        <li>Disconnected</li>
                        <li>Proxy-aware</li>
                        <li>Designed for FIPS</li>
                      </ul>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Repository</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        component="a"
                        href="https://github.com/openshift/"
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={<ExternalLinkAltIcon />}
                        iconPosition="right"
                      >
                        github.com/openshift
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              ) : null}
            </DescriptionList>
          </aside>

          <div className="ocs-catalog-detail__body">
            <Content component="p">{item.description}</Content>
            {isOperator ? (
              item.installed ? (
                <>
                  <Title headingLevel="h3" size="md" className="pf-v6-u-mt-lg pf-v6-u-mb-sm">
                    Special considerations for disconnected environments
                  </Title>
                  <Content component="p">
                    Mirror the operator bundle and related images into your registry, then reference that mirror in your{" "}
                    <InlineCode>ImageContentSourcePolicy</InlineCode> or <InlineCode>CatalogSource</InlineCode>{" "}
                    configuration.
                  </Content>
                </>
              ) : null
            ) : (
              <Content component="p" className="pf-v6-u-mt-md">
                Add this {item.typeLabel.toLowerCase()} to your project from the catalog.
              </Content>
            )}
          </div>
        </div>

      </DrawerPanelBody>
    </>
  );
}
