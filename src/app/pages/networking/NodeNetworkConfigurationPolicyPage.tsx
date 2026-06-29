import { Button, Content, Flex } from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import { NetworkingPageShell } from "./networkingShared";

export default function NodeNetworkConfigurationPolicyPage() {
  return (
    <NetworkingPageShell
      title="NodeNetworkConfigurationPolicy"
      path="/networking/nodenetworkconfigurationpolicy"
      createButton={
        <Button variant="primary">
          Create NodeNetworkConfigurationPolicy
        </Button>
      }
    >
      <div className="ocs-nnodes-policy-empty app-glass-panel">
        <Flex
          direction={{ default: "column" }}
          alignItems={{ default: "alignItemsCenter" }}
          gap={{ default: "gapLg" }}
          className="pf-v6-u-py-3xl"
        >
          <div className="ocs-nnodes-policy-empty__illustration" aria-hidden />
          <Content component="h2" className="ocs-nnodes-policy-empty__title">
            No NodeNetworkConfigurationPolicy found
          </Content>
          <Content component="p" className="ocs-nnodes-policy-empty__desc">
            Click Create NodeNetworkConfigurationPolicy to create your first policy
          </Content>
          <Button variant="primary">Create NodeNetworkConfigurationPolicy</Button>
          <Button
            variant="link"
            isInline
            icon={<ExternalLinkAltIcon />}
            iconPosition="right"
            component="a"
            href="https://docs.openshift.com/container-platform/latest/networking/k8s_nic_configuration/k8s-nic-configuration.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            View documentation
          </Button>
        </Flex>
      </div>
    </NetworkingPageShell>
  );
}
