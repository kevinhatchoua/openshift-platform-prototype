import { Alert, Content, Flex, Label } from "@patternfly/react-core";

/** PatternFly compact label for tech-preview surfaces (nav, page title, alert title). */
export function NetworkingTechPreviewLabel() {
  return (
    <Label color="orange" isCompact className="ocs-networking-tech-preview-label">
      Tech preview
    </Label>
  );
}

/** Page-top tech preview notice for Networking → Topology (OCP console handoff pattern). */
export function NetworkingTopologyTechPreviewAlert() {
  return (
    <Alert
      variant="info"
      title={
        <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
          <span>Network configuration</span>
          <NetworkingTechPreviewLabel />
        </Flex>
      }
      className="ocs-networking-tech-preview-alert"
    >
      <Content component="p">
        This view is a tech preview feature. Behavior, APIs, and support may change in future releases. Not recommended
        for production-critical workflows.
      </Content>
    </Alert>
  );
}