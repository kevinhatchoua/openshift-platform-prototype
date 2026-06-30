import { Content, Flex } from "@patternfly/react-core";
import { VirtResourceTableShell } from "./virtualizationShared";

const CHECKUPS = [
  { name: "kubevirt-vm", description: "Validate VirtualMachine scheduling and storage" },
  { name: "kubevirt-storage", description: "Validate storage access for VMs" },
];

export default function CheckupsPage() {
  return (
    <VirtResourceTableShell title="Checkups" path="/virtualization/checkups">
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-p-lg">
        {CHECKUPS.map((c) => (
          <div key={c.name} className="ocs-virt-checkup-row">
            <Content component="h3" className="pf-v6-u-font-weight-bold">
              {c.name}
            </Content>
            <Content component="p" className="pf-v6-u-color-200">
              {c.description}
            </Content>
          </div>
        ))}
      </Flex>
    </VirtResourceTableShell>
  );
}
