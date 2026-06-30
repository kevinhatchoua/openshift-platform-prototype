import { Flex, Label } from "@patternfly/react-core";
import {
  getPhysicalUnderlayForBridge,
  type PhysicalUnderlaySegment,
} from "./nodeNetworkStateMockData";

function UnderlaySegment({ segment }: { segment: PhysicalUnderlaySegment }) {
  const kindLabel =
    segment.kind === "nic"
      ? "NIC"
      : segment.kind === "bond"
        ? "Bond"
        : segment.kind === "vlan"
          ? "VLAN"
          : "Bridge";

  return (
    <Flex
      direction={{ default: "column" }}
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapNone" }}
      className={`ocs-net-topo-underlay__segment ocs-net-topo-underlay__segment--${segment.kind}`}
    >
      <Label color={segment.badgeColor} isCompact className="ocs-net-topo-underlay__badge">
        {kindLabel}
      </Label>
      <span className="ocs-net-topo-underlay__label">{segment.label}</span>
    </Flex>
  );
}

export default function PhysicalUnderlayChain({
  bridgeResourceId,
  highlighted = false,
}: {
  bridgeResourceId: string;
  highlighted?: boolean;
}) {
  const chain = getPhysicalUnderlayForBridge(bridgeResourceId);
  if (!chain) return null;

  return (
    <div
      className={`ocs-net-topo-underlay${highlighted ? " ocs-net-topo-underlay--path-active" : ""}`}
      aria-label={`Physical underlay for ${chain.segments.at(-1)?.label ?? "bridge"}`}
    >
      {chain.segments.map((segment, index) => (
        <Flex key={`${segment.kind}-${segment.label}`} alignItems={{ default: "alignItemsCenter" }}>
          {index > 0 ? (
            <span className="ocs-net-topo-underlay__arrow" aria-hidden>
              →
            </span>
          ) : null}
          <UnderlaySegment segment={segment} />
        </Flex>
      ))}
    </div>
  );
}
