import { Link, useLocation, useSearchParams } from "react-router";
import { Content, Flex } from "@patternfly/react-core";
import { GITOPS_SUB } from "../../navigation/consoleNav";

function isActive(path: string, pathname: string) {
  if (path === "/gitops/overview") {
    return pathname === "/gitops/overview" || pathname === "/gitops";
  }
  if (path === "/gitops/applications") {
    return pathname === path || pathname.includes("/applications/");
  }
  if (path === "/gitops/applicationsets") {
    return pathname === path || pathname.includes("/applicationsets/");
  }
  if (path === "/gitops/rollouts") {
    return pathname === path || pathname.includes("/rollouts/");
  }
  if (path === "/gitops/argocd") {
    return pathname === path || pathname.includes("/argocd/");
  }
  if (path === "/gitops/appprojects") {
    return pathname === path || pathname.includes("/appprojects/");
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function GitOpsSubNav() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const instance = searchParams.get("instance");

  return (
    <nav aria-label="GitOps sections" className="ocs-gitops-subnav">
      <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
        {GITOPS_SUB.map((entry) => {
          if (entry === "separator") return null;
          const active = isActive(entry.path, pathname);
          const to =
            instance && !entry.path.includes("?")
              ? `${entry.path}?instance=${encodeURIComponent(instance)}`
              : entry.path;
          return (
            <Link
              key={entry.path}
              to={to}
              className={`ocs-gitops-subnav__link${active ? " ocs-gitops-subnav__link--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Content component="small">{entry.label}</Content>
            </Link>
          );
        })}
      </Flex>
    </nav>
  );
}
