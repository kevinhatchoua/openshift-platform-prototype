import { useState } from "react";
import {
  Alert,
  Button,
  Content,
  Flex,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput,
  Title,
} from "@patternfly/react-core";

type GitOpsAccessTestPanelProps = {
  resourceLabel: string;
  defaultResource?: string;
};

export default function GitOpsAccessTestPanel({
  resourceLabel,
  defaultResource = "applications",
}: GitOpsAccessTestPanelProps) {
  const [subject, setSubject] = useState("");
  const [action, setAction] = useState("get");
  const [resource, setResource] = useState(defaultResource);
  const [testResult, setTestResult] = useState<"success" | "danger" | null>(null);
  const [testMessage, setTestMessage] = useState("");

  const runAccessTest = () => {
    const allowed = subject.trim().length > 0 && action !== "create";
    setTestResult(allowed ? "success" : "danger");
    setTestMessage(
      allowed
        ? `Allowed: subject "${subject || "(empty)"}" may ${action} ${resource || "resource"} for ${resourceLabel}.`
        : `Denied: subject "${subject || "(empty)"}" may not ${action} ${resource || "resource"} for ${resourceLabel} (mock RBAC).`
    );
  };

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} style={{ maxWidth: 520 }}>
      <Title headingLevel="h2" size="lg">
        RBAC policy tester
      </Title>
      <Content component="p" className="pf-v6-u-color-200">
        Evaluate whether a subject can perform an action on a resource. Same pattern as AppProject Access Test
        (GITOPS-10917 P1).
      </Content>
      <Form>
        <FormGroup label="Subject" fieldId="access-subject" isRequired>
          <TextInput
            id="access-subject"
            value={subject}
            onChange={(_e, v) => setSubject(v)}
            placeholder="user:alice or group:payments-devs"
          />
        </FormGroup>
        <FormGroup label="Action" fieldId="access-action">
          <FormSelect id="access-action" value={action} onChange={(_e, v) => setAction(v)} aria-label="Action">
            <FormSelectOption value="get" label="get" />
            <FormSelectOption value="list" label="list" />
            <FormSelectOption value="sync" label="sync" />
            <FormSelectOption value="create" label="create" />
          </FormSelect>
        </FormGroup>
        <FormGroup label="Resource" fieldId="access-resource">
          <TextInput
            id="access-resource"
            value={resource}
            onChange={(_e, v) => setResource(v)}
            placeholder={defaultResource}
          />
        </FormGroup>
        <Button variant="primary" onClick={runAccessTest}>
          Run test
        </Button>
      </Form>
      {testResult ? (
        <Alert variant={testResult} title={testResult === "success" ? "Allowed" : "Denied"} isInline>
          {testMessage}
        </Alert>
      ) : null}
    </Flex>
  );
}
