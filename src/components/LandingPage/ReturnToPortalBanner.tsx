import { Link } from "react-router";
import { Banner, Button } from "@patternfly/react-core";
import ArrowRightIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon";

export default function ReturnToPortalBanner() {
  return (
    <Banner status="warning" className="ocs-return-portal-banner">
      <Button
        variant="link"
        isInline
        component={Link}
        to="/"
        icon={<ArrowRightIcon aria-hidden className="ocs-return-portal-banner__arrow" />}
        iconPosition="right"
      >
        Return to Homepage
      </Button>
    </Banner>
  );
}
