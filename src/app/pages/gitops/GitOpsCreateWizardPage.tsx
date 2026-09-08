/**
 * Guided Create wizards (P4 / GITOPS-10917) — prototype entry points.
 */
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Button,
  Content,
  Flex,
  Form,
  FormGroup,
  TextInput,
  Title,
  Wizard,
  WizardStep,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useToast } from "../../contexts/ToastContext";
import { gitopsDetailPath } from "./gitopsData";
import { createStubApplicationSet, registerPrototypeApplicationSet } from "./prototypeGitopsStore";

const KIND_LABEL: Record<string, string> = {
  application: "Application",
  applicationset: "ApplicationSet",
  appproject: "AppProject",
  rollout: "Rollout",
  argocd: "Argo CD",
  imageupdater: "ImageUpdater",
  promotion: "Promotion pipeline",
};

function listPathForKind(kind: string) {
  if (kind === "rollout") return "/gitops/rollouts";
  if (kind === "applicationset") return "/gitops/applicationsets";
  if (kind === "appproject") return "/gitops/appprojects";
  if (kind === "argocd") return "/gitops/argocd";
  if (kind === "imageupdater") return "/gitops/imageupdaters";
  if (kind === "promotion") return "/gitops/promotions";
  return "/gitops/applications";
}

function detailPathForKind(kind: string, ns: string, name: string) {
  if (kind === "rollout") return gitopsDetailPath("rollouts", ns, name);
  if (kind === "applicationset") return gitopsDetailPath("applicationsets", ns, name);
  if (kind === "appproject") return gitopsDetailPath("appprojects", ns, name);
  if (kind === "argocd") return gitopsDetailPath("argocd", ns, name);
  if (kind === "imageupdater") return gitopsDetailPath("imageupdaters", ns, name);
  if (kind === "promotion") return gitopsDetailPath("promotions", ns, name);
  return gitopsDetailPath("applications", ns, name);
}

function kindSpecificStep(kind: string) {
  if (kind === "applicationset") {
    return (
      <Form>
        <FormGroup label="Generators" fieldId="gitops-create-generators">
          <TextInput id="gitops-create-generators" defaultValue="Git directory generator" />
        </FormGroup>
        <FormGroup label="Template path" fieldId="gitops-create-template">
          <TextInput id="gitops-create-template" defaultValue="applicationsets/tenants" />
        </FormGroup>
      </Form>
    );
  }
  if (kind === "rollout") {
    return (
      <Form>
        <FormGroup label="Strategy" fieldId="gitops-create-strategy">
          <TextInput id="gitops-create-strategy" defaultValue="Canary" />
        </FormGroup>
        <FormGroup label="Workload reference" fieldId="gitops-create-workload">
          <TextInput id="gitops-create-workload" defaultValue="Deployment/demo-api" />
        </FormGroup>
      </Form>
    );
  }
  if (kind === "promotion") {
    return (
      <Form>
        <FormGroup label="Environments" fieldId="gitops-create-envs">
          <TextInput id="gitops-create-envs" defaultValue="dev, staging, prod" />
        </FormGroup>
        <FormGroup label="Gates" fieldId="gitops-create-gates">
          <TextInput id="gitops-create-gates" defaultValue="manual approval (staging→prod)" />
        </FormGroup>
      </Form>
    );
  }
  if (kind === "argocd") {
    return (
      <Form>
        <FormGroup label="Server URL" fieldId="gitops-create-server">
          <TextInput id="gitops-create-server" defaultValue="https://argocd-server.example.com" />
        </FormGroup>
      </Form>
    );
  }
  return (
    <Form>
      <FormGroup label="Repository URL" fieldId="gitops-create-repo">
        <TextInput
          id="gitops-create-repo"
          name="repo"
          defaultValue="https://github.com/argoproj/argocd-example-apps.git"
        />
      </FormGroup>
      <FormGroup label="Path" fieldId="gitops-create-path">
        <TextInput id="gitops-create-path" name="path" defaultValue="guestbook" />
      </FormGroup>
    </Form>
  );
}

export default function GitOpsCreateWizardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pushToast } = useToast();
  const kind = (params.get("kind") || "application").toLowerCase();
  const label = KIND_LABEL[kind] ?? "Application";
  const listPath = listPathForKind(kind);
  const [name, setName] = useState(`demo-${kind}`);
  const [namespace, setNamespace] = useState("argocd");

  const finishCreate = () => {
    if (kind === "applicationset") {
      registerPrototypeApplicationSet(namespace, name, createStubApplicationSet(namespace, name));
    }
    pushToast({ variant: "success", title: `Created ${label} ${name} (prototype)` });
    navigate(detailPathForKind(kind, namespace, name));
  };

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: `Create ${label}` },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Title headingLevel="h1" size="2xl">
            Create {label}
          </Title>
          <Content component="p">
            Guided create wizard (GITOPS-10917 P4). Completing the wizard navigates to the new resource detail
            page.
          </Content>
          <Wizard
            height={420}
            title={`Create ${label}`}
            onClose={() => navigate(listPath)}
            footer={{
              nextButtonText: "Next",
              backButtonText: "Back",
              cancelButtonText: "Cancel",
              onClose: () => navigate(listPath),
            }}
          >
            <WizardStep id="basics" name="Basics" footer={{ nextButtonText: "Next" }}>
              <Form>
                <FormGroup label="Name" isRequired fieldId="gitops-create-name">
                  <TextInput
                    id="gitops-create-name"
                    name="name"
                    value={name}
                    onChange={(_e, v) => setName(v)}
                  />
                </FormGroup>
                <FormGroup label="Namespace" isRequired fieldId="gitops-create-ns">
                  <TextInput
                    id="gitops-create-ns"
                    name="namespace"
                    value={namespace}
                    onChange={(_e, v) => setNamespace(v)}
                  />
                </FormGroup>
              </Form>
            </WizardStep>
            <WizardStep
              id="source"
              name={kind === "argocd" ? "Instance" : kind === "promotion" ? "Pipeline" : "Source"}
              footer={{ nextButtonText: "Next" }}
            >
              {kindSpecificStep(kind)}
            </WizardStep>
            <WizardStep
              id="review"
              name="Review"
              footer={{
                nextButtonText: "Create",
                onNext: finishCreate,
              }}
            >
              <Content component="p">
                Review configuration for <strong>{name}</strong> in namespace <strong>{namespace}</strong>.
              </Content>
              <Button variant="link" onClick={finishCreate}>
                Create {label} and open details
              </Button>
            </WizardStep>
          </Wizard>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
