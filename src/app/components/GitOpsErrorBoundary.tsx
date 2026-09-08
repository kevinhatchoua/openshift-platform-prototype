import { Component, type ErrorInfo, type ReactNode } from "react";
import { useNavigate, useRouteError } from "react-router";
import { Button, Content, Flex, Title } from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

type GitOpsErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
};

type GitOpsErrorBoundaryState = {
  error: Error | null;
};

/** Catches render errors in GitOps pages and shows a recoverable fallback. */
export class GitOpsErrorBoundary extends Component<GitOpsErrorBoundaryProps, GitOpsErrorBoundaryState> {
  state: GitOpsErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("GitOps page error:", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <GitOpsErrorFallback
          title={this.props.title ?? "GitOps page failed to load"}
          message={this.state.error.message}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

export function GitOpsRouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <GitOpsErrorFallback
      title="GitOps route error"
      message={message}
      onRetry={() => navigate(0)}
    />
  );
}

function GitOpsErrorFallback({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="ocs-app-page-outer w-full">
      <Flex
        direction={{ default: "column" }}
        alignItems={{ default: "alignItemsCenter" }}
        justifyContent={{ default: "justifyContentCenter" }}
        gap={{ default: "gapMd" }}
        className="pf-v6-u-p-xl pf-v6-u-text-align-center"
      >
        <ExclamationCircleIcon style={{ width: "2.5rem", height: "2.5rem" }} />
        <Title headingLevel="h1" size="xl">{title}</Title>
        <Content component="p" className="pf-v6-u-color-200 pf-v6-u-max-width-ch-60">
          {message}
        </Content>
        <Button variant="primary" onClick={onRetry}>Try again</Button>
      </Flex>
    </div>
  );
}
