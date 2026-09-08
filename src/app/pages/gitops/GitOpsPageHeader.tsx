import { type ReactNode } from "react";
import { Flex, Title } from "@patternfly/react-core";
import FavoriteButton from "../../components/FavoriteButton";
import GitOpsInstancePicker, { useGitOpsInstance } from "./GitOpsInstancePicker";

type GitOpsPageHeaderProps = {
  title: string;
  path: string;
  actions?: ReactNode;
  showInstancePicker?: boolean;
};

export default function GitOpsPageHeader({
  title,
  path,
  actions,
  showInstancePicker = true,
}: GitOpsPageHeaderProps) {
  const { instance, setInstance } = useGitOpsInstance();
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      justifyContent={{ default: "justifyContentSpaceBetween" }}
      flexWrap={{ default: "wrap" }}
      gap={{ default: "gapMd" }}
    >
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
        <Title headingLevel="h1" size="2xl">
          {title}
        </Title>
        <FavoriteButton name={title} path={path} />
      </Flex>
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
        {showInstancePicker ? (
          <GitOpsInstancePicker instance={instance} setInstance={setInstance} />
        ) : null}
        {actions}
      </Flex>
    </Flex>
  );
}

export { useGitOpsInstance };
