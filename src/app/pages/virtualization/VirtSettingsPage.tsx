import { Content, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Switch } from "@patternfly/react-core";
import { useState } from "react";
import { VirtResourceTableShell } from "./virtualizationShared";

export default function VirtSettingsPage() {
  const [autoAttach, setAutoAttach] = useState(true);
  const [defaultNetwork, setDefaultNetwork] = useState(false);

  return (
    <VirtResourceTableShell title="Settings" path="/virtualization/settings">
      <div className="pf-v6-u-p-lg">
        <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>Default instance type</DescriptionListTerm>
            <DescriptionListDescription>u1.medium</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Auto attach bootable volumes</DescriptionListTerm>
            <DescriptionListDescription>
              <Switch
                id="auto-attach"
                isChecked={autoAttach}
                onChange={(_e, v) => setAutoAttach(v)}
                aria-label="Auto attach bootable volumes"
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Enable default pod network</DescriptionListTerm>
            <DescriptionListDescription>
              <Switch
                id="default-network"
                isChecked={defaultNetwork}
                onChange={(_e, v) => setDefaultNetwork(v)}
                aria-label="Enable default pod network"
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
        <Content component="p" className="pf-v6-u-mt-lg pf-v6-u-color-200">
          Virtualization settings prototype — values are not persisted.
        </Content>
      </div>
    </VirtResourceTableShell>
  );
}
