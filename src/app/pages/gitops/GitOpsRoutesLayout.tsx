import { Outlet } from "react-router";
import { Flex } from "@patternfly/react-core";
import { GitOpsErrorBoundary } from "../../components/GitOpsErrorBoundary";
import GitOpsSubNav from "./GitOpsSubNav";

export default function GitOpsRoutesLayout() {
  return (
    <GitOpsErrorBoundary title="GitOps page failed to load">
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="ocs-gitops-layout">
        <GitOpsSubNav />
        <Outlet />
      </Flex>
    </GitOpsErrorBoundary>
  );
}
