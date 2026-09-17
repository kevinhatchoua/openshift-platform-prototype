import { Outlet, useLocation } from "react-router";
import { GitOpsErrorBoundary } from "../../components/GitOpsErrorBoundary";

export default function GitOpsRoutesLayout() {
  const location = useLocation();

  return (
    <GitOpsErrorBoundary key={location.pathname} title="GitOps page failed to load">
      <Outlet />
    </GitOpsErrorBoundary>
  );
}
