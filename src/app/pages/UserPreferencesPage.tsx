import { useState } from "react";
import {
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Title,
} from "@patternfly/react-core";
import ThemePreferencesDropdown from "../components/ThemePreferencesDropdown";

type PrefTab = "general" | "language";

const LAST_VIEWED = "last-viewed";

/**
 * OpenShift-aligned User Preferences (General + Language).
 * Theme uses PatternFly 6 tiers: Theme, Color scheme, Contrast mode.
 */
export default function UserPreferencesPage() {
  const [activeTab, setActiveTab] = useState<PrefTab>("general");
  const [perspective, setPerspective] = useState(LAST_VIEWED);
  const [project, setProject] = useState(LAST_VIEWED);
  const [topology, setTopology] = useState(LAST_VIEWED);
  const [editMethod, setEditMethod] = useState(LAST_VIEWED);
  const [language, setLanguage] = useState("browser-default");

  return (
    <div className="ocs-app-page-outer ocs-user-preferences">
      <Title headingLevel="h1" className="pf-v6-u-mb-sm">
        User Preferences
      </Title>
      <Content component="p" className="pf-v6-u-mb-lg">
        Set your individual preferences for the console experience. Any changes will be autosaved.
      </Content>

      <div className="ocs-user-preferences__layout">
        <nav className="ocs-user-preferences__nav" aria-label="User preference categories">
          <ul className="ocs-user-preferences__nav-list">
            {(
              [
                ["general", "General"],
                ["language", "Language"],
              ] as const
            ).map(([id, label]) => (
              <li key={id}>
                <button
                  type="button"
                  className={`ocs-user-preferences__nav-button${activeTab === id ? " is-active" : ""}`}
                  aria-current={activeTab === id ? "page" : undefined}
                  onClick={() => setActiveTab(id)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ocs-user-preferences__content">
          {activeTab === "general" ? (
            <Form isWidthLimited className="ocs-user-preferences__form">
              <FormGroup label="Theme" fieldId="user-pref-theme">
                <ThemePreferencesDropdown idPrefix="user-pref-theme" />
                <Content component="small" className="pf-v6-u-mt-sm">
                  Open the menu to set contrast mode and color scheme. Changes apply immediately.
                </Content>
              </FormGroup>

              <FormGroup label="Perspective" fieldId="user-pref-perspective">
                <FormSelect
                  id="user-pref-perspective"
                  className="ocs-user-preferences__field"
                  value={perspective}
                  onChange={(_e, value) => setPerspective(value)}
                  aria-label="Perspective"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="admin" label="Administrator" />
                  <FormSelectOption value="dev" label="Developer" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  If a perspective is not selected, the console defaults to the last viewed.
                </Content>
              </FormGroup>

              <FormGroup label="Project" fieldId="user-pref-project">
                <FormSelect
                  id="user-pref-project"
                  className="ocs-user-preferences__field"
                  value={project}
                  onChange={(_e, value) => setProject(value)}
                  aria-label="Project"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="all" label="All Projects" />
                  <FormSelectOption value="default" label="default" />
                  <FormSelectOption value="openshift" label="openshift" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  If a project is not selected, the console defaults to the last viewed.
                </Content>
              </FormGroup>

              <FormGroup label="Topology" fieldId="user-pref-topology">
                <FormSelect
                  id="user-pref-topology"
                  className="ocs-user-preferences__field"
                  value={topology}
                  onChange={(_e, value) => setTopology(value)}
                  aria-label="Topology"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="graph" label="Graph" />
                  <FormSelectOption value="list" label="List" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  If a topology view is not selected, the console defaults to the last viewed.
                </Content>
              </FormGroup>

              <FormGroup label="Create/Edit resource method" fieldId="user-pref-edit-method">
                <FormSelect
                  id="user-pref-edit-method"
                  className="ocs-user-preferences__field"
                  value={editMethod}
                  onChange={(_e, value) => setEditMethod(value)}
                  aria-label="Create/Edit resource method"
                >
                  <FormSelectOption value={LAST_VIEWED} label="Last viewed" />
                  <FormSelectOption value="form" label="Form" />
                  <FormSelectOption value="yaml" label="YAML" />
                </FormSelect>
              </FormGroup>
            </Form>
          ) : (
            <Form isWidthLimited className="ocs-user-preferences__form">
              <FormGroup label="Language" fieldId="user-pref-language">
                <FormSelect
                  id="user-pref-language"
                  className="ocs-user-preferences__field"
                  value={language}
                  onChange={(_e, value) => setLanguage(value)}
                  aria-label="Language"
                >
                  <FormSelectOption value="browser-default" label="Browser default" />
                  <FormSelectOption value="en" label="English" />
                </FormSelect>
                <Content component="small" className="pf-v6-u-mt-sm">
                  Language changes apply after you reload the console.
                </Content>
              </FormGroup>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
