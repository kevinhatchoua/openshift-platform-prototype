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
  onClose: () => void;
  onInstall?: () => void;
  onUpdate?: () => void;
  onViewDetails?: () => void;
};

export default function CatalogOperatorDetailPanel({
  item,
  onClose,
  onInstall,
  onUpdate,
  onViewDetails,
}: CatalogOperatorDetailPanelProps) {
  const isOperator = item.catalogType === "operators";

  return (
    <>
      <DrawerHead>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flex={{ default: "flex_1" }}>
          <CatalogBrandLogo
            id={item.id}
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
        <DrawerActions>
          <DrawerCloseButton onClose={onClose} />
        </DrawerActions>
      </DrawerHead>

      <DrawerPanelBody>
        {isOperator && item.hasUpdate ? (
          <Alert
            variant="warning"
            isInline
            title={`New version ${item.newVersion} available`}
            className="pf-v6-u-mb-md"
            customActions={
              <Flex gap={{ default: "gapSm" }}>
                <Button variant="link" isInline onClick={onUpdate}>
                  Update
                </Button>
                <Button variant="link" isInline onClick={onViewDetails}>
                  View details
                </Button>
              </Flex>
            }
          />
        ) : null}

        <div className="ocs-catalog-detail__grid">
          <aside className="ocs-catalog-detail__meta" aria-label="Catalog item metadata">
            <DescriptionList isCompact>
              {isOperator ? (
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
              <>
                <Title headingLevel="h3" size="md" className="pf-v6-u-mt-lg pf-v6-u-mb-sm">
                  How to install
                </Title>
                <Content component="p">
                  From the <InlineCode>OperatorHub</InlineCode> catalog, choose this operator and create a{" "}
                  <InlineCode>Subscription</InlineCode> in your target namespace. The Operator Lifecycle Manager (OLM)
                  will reconcile the required CSV and related objects.
                </Content>
                <Title headingLevel="h3" size="md" className="pf-v6-u-mt-lg pf-v6-u-mb-sm">
                  Special considerations for disconnected environments
                </Title>
                <Content component="p">
                  Mirror the operator bundle and related images into your registry, then reference that mirror in your{" "}
                  <InlineCode>ImageContentSourcePolicy</InlineCode> or <InlineCode>CatalogSource</InlineCode>{" "}
                  configuration.
                </Content>
              </>
            ) : (
              <Content component="p" className="pf-v6-u-mt-md">
                Add this {item.typeLabel.toLowerCase()} to your project from the catalog.
              </Content>
            )}
          </div>
        </div>

        {isOperator && !item.installed ? (
          <>
            <Divider className="pf-v6-u-my-md" />
            <Flex justifyContent={{ default: "justifyContentFlexEnd" }}>
              <Button variant="primary" onClick={onInstall}>
                Install
              </Button>
            </Flex>
          </>
        ) : null}
      </DrawerPanelBody>
    </>
  );
}
