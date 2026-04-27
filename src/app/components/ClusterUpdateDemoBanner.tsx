import {
  Banner,
  Content,
  Flex,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import { useClusterUpdateDemoVariant } from "../contexts/ClusterUpdateDemoContext";

/** Sits above the masthead; variant toggle is shared with Cluster Update via context. */
export default function ClusterUpdateDemoBanner() {
  const { demoVariant, setDemoVariant } = useClusterUpdateDemoVariant();

  return (
    <Banner status="info" aria-label="Prototype demo">
      <Flex
        justifyContent={{ default: "justifyContentSpaceBetween" }}
        alignItems={{ default: "alignItemsCenter" }}
        gap={{ default: "gapMd" }}
        flexWrap={{ default: "wrap" }}
      >
        <Content
          component="p"
          style={{
            margin: 0,
            fontSize: "var(--pf-t--global--FontSize--xs)",
            fontWeight: 600,
            textTransform: "uppercase",
            color: "var(--pf-t--global--text--Color--200)",
          }}
        >
          Prototype demo
        </Content>
        <ToggleGroup
          aria-label="Cluster update experience variant"
          isCompact
        >
          <ToggleGroupItem
            text={
              <Content component="span">OCP 5.0</Content>
            }
            isSelected={demoVariant === "agent-only"}
            onChange={(_event, selected) => {
              if (selected) {
                setDemoVariant("agent-only");
              }
            }}
          />
          <ToggleGroupItem
            text={
              <Content component="span">OCP 5.1</Content>
            }
            isSelected={demoVariant === "manual-and-agent"}
            onChange={(_event, selected) => {
              if (selected) {
                setDemoVariant("manual-and-agent");
              }
            }}
          />
        </ToggleGroup>
      </Flex>
    </Banner>
  );
}
