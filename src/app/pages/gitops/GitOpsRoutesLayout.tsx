import { Outlet } from "react-router";
import { GitOpsErrorBoundary } from "../../components/GitOpsErrorBoundary";

export default function GitOpsRoutesLayout() {
  return (
    <GitOpsErrorBoundary title="GitOps page failed to load">
      <Outlet />
    </GitOpsErrorBoundary>
  );
}
