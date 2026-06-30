import { Link } from "react-router";
import { Button, Content, Flex } from "@patternfly/react-core";
import { VirtResourceTableShell } from "./virtualizationShared";

export default function VirtualMachineNetworksPage() {
  return (
    <VirtResourceTableShell title="Virtual machine networks" path="/virtualization/virtualmachinenetworks">
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-p-lg">
        <Content component="p">
          Manage secondary networks used by VirtualMachines. NetworkAttachmentDefinitions and UserDefinedNetworks are
          configured in the Networking section.
        </Content>
        <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
          <Button variant="primary" component={Link} to="/networking/networkattachmentdefinitions">
            NetworkAttachmentDefinitions
          </Button>
          <Button variant="secondary" component={Link} to="/networking/userdefinednetworks">
            UserDefinedNetworks
          </Button>
        </Flex>
      </Flex>
    </VirtResourceTableShell>
  );
}
