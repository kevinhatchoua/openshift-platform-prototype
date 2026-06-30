import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Content } from "@patternfly/react-core";
import { useToast } from "../../contexts/ToastContext";
import NetworkTopologyPanel from "./NetworkTopologyPanel";
import { OpenWorkerNodeModal } from "./OpenWorkerNodeModal";
import {
  RemoveWorkerNodeGroupModal,
  type WorkerNodeRemovalTarget,
} from "./RemoveWorkerNodeGroupModal";
import { TOPOLOGY_WORKER_CATALOG } from "./networkTopologyData";
import { NNC_WIZARD_STEPS } from "./NodeNetworkConfigurationWizard";
import { nadDetailPath } from "./networkingMockData";
import { NetworkingPageShell } from "./networkingShared";
import { useNetworkTopologyState } from "./networkTopologyState";
import { useNodeNetworkConfigurationCreate } from "./useNodeNetworkConfigurationCreate";

export default function NetworkTopologyPage() {
  const navigate = useNavigate();
  const { pushToast, dismissToast } = useToast();
  const {
    groups,
    standaloneResources,
    crossEdges,
    networkNodeAssignments,
    revealedGroupIds,
    provisionGeneration,
    fitContentToken,
    setStandaloneResources,
    setCrossEdges,
    setWorkerAssignedToNetwork,
    addLogicalNetwork,
    attachStandaloneToGroup,
    revealWorkerGroups,
    hideWorkerGroups,
  } = useNetworkTopologyState();
  const [workerNodeModalOpen, setWorkerNodeModalOpen] = useState(false);
  const [workerRemovalTarget, setWorkerRemovalTarget] = useState<WorkerNodeRemovalTarget | null>(null);

  const {
    openFormWizard,
    activeStep,
    setActiveStep,
    physicalNetworkName,
    setPhysicalNetworkName,
    handleCreateConfiguration,
  } = useNodeNetworkConfigurationCreate(pushToast, dismissToast, {
    successTitle: (configName) =>
      `Successfully created node network configuration for ${configName}. Drag standalone resources onto worker nodes to attach them.`,
  });

  const handleAttachStandaloneToGroup = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      const standalone = attachStandaloneToGroup(resourceId, groupId, connectToResourceId);
      if (!standalone) return;
      pushToast({
        variant: "info",
        title: `Attached ${standalone.label} to ${standalone.targetNodeLabel}.`,
      });
    },
    [attachStandaloneToGroup, pushToast]
  );

  const handleAddWorkersToTopology = useCallback(
    (workerIds: string[]) => {
      revealWorkerGroups(workerIds);
      const count = workerIds.length;
      pushToast({
        variant: "success",
        title: `Added ${count} worker node${count === 1 ? "" : "s"} to the topology.`,
      });
    },
    [revealWorkerGroups, pushToast]
  );

  const openWorkerNodeModal = useCallback(() => {
    setWorkerNodeModalOpen(true);
  }, []);

  const requestRemoveWorkerGroup = useCallback(
    (worker: { id: string; shortName: string; hostname: string }) => {
      setWorkerRemovalTarget({
        id: worker.id,
        shortName: worker.shortName,
        hostname: worker.hostname,
      });
    },
    []
  );

  const confirmRemoveWorkerGroup = useCallback(
    (workerId: string) => {
      const worker = TOPOLOGY_WORKER_CATALOG.find((entry) => entry.id === workerId);
      hideWorkerGroups([workerId]);
      pushToast({
        variant: "success",
        title: worker
          ? `Removed ${worker.shortName} from the topology.`
          : "Removed worker node group from the topology.",
      });
      setWorkerRemovalTarget(null);
    },
    [hideWorkerGroups, pushToast]
  );

  return (
    <>
      <NetworkingPageShell
        title="Topology"
        path="/networking/topology"
        extraHeader={
          <Content component="p" className="ocs-net-topo-page-desc">
            Visualize, scale, and manage your cluster topology. Right-click the canvas to add nodes, or manage worker
            node groups from the toolbar.
          </Content>
        }
      >
        <div className="ocs-nnc-stage">
          <NetworkTopologyPanel
            groups={groups}
            standaloneResources={standaloneResources}
            crossEdges={crossEdges}
            networkNodeAssignments={networkNodeAssignments}
            revealedGroupIds={revealedGroupIds}
            onStandaloneResourcesChange={setStandaloneResources}
            onCrossEdgesChange={setCrossEdges}
            onWorkerAssignmentChange={setWorkerAssignedToNetwork}
            onAttachStandaloneToGroup={handleAttachStandaloneToGroup}
            onOpenWorkerNodeModal={openWorkerNodeModal}
            onRequestRemoveWorkerGroup={requestRemoveWorkerGroup}
            fitContentToken={fitContentToken}
            highlightResourceSuffix={provisionGeneration > 0 ? "br-localnet" : undefined}
            activeStep={NNC_WIZARD_STEPS[activeStep]?.id}
            physicalNetworkName={physicalNetworkName}
            nncWizard={{
              activeStep,
              onActiveStepChange: setActiveStep,
              physicalNetworkName,
              onPhysicalNetworkNameChange: setPhysicalNetworkName,
              onCreate: handleCreateConfiguration,
              onOpen: openFormWizard,
            }}
            onNadCreated={(record) => {
              pushToast({
                variant: "success",
                title: `Created NetworkAttachmentDefinition ${record.name}.`,
              });
              navigate(nadDetailPath(record.namespace, record.name));
            }}
            onUdnCreated={(record) => {
              addLogicalNetwork(record);
              pushToast({
                variant: "success",
                title: `Created UserDefinedNetwork ${record.name}. Linked on the topology graph.`,
              });
            }}
            onCudnCreated={(record) => {
              addLogicalNetwork(record);
              pushToast({
                variant: "success",
                title: `Created ClusterUserDefinedNetwork ${record.name}. Linked on the topology graph.`,
              });
            }}
            onNncpCreated={(record) => {
              pushToast({
                variant: "success",
                title: `Created NodeNetworkConfigurationPolicy ${record.name}.`,
              });
              navigate("/networking/nodenetworkconfigurationpolicy");
            }}
          />
        </div>
      </NetworkingPageShell>
      <OpenWorkerNodeModal
        isOpen={workerNodeModalOpen}
        onClose={() => setWorkerNodeModalOpen(false)}
        workers={TOPOLOGY_WORKER_CATALOG}
        revealedGroupIds={revealedGroupIds}
        onAddWorkers={handleAddWorkersToTopology}
        onRequestRemoveWorker={(worker) => {
          setWorkerNodeModalOpen(false);
          requestRemoveWorkerGroup(worker);
        }}
      />
      <RemoveWorkerNodeGroupModal
        target={workerRemovalTarget}
        onClose={() => setWorkerRemovalTarget(null)}
        onConfirm={confirmRemoveWorkerGroup}
      />
    </>
  );
}
