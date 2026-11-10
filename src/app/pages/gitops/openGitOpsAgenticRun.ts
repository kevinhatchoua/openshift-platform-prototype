import { navigateToGitOpsAgenticRun } from "./gitopsAgenticContract";
import type { ApplicationRecord } from "./gitopsData";

/** Same-tab navigation to the agentic run referenced on the Application (annotation contract). */
export function openGitOpsAgenticRunForApplication(
  app: ApplicationRecord,
  navigate: (path: string) => void,
): void {
  navigateToGitOpsAgenticRun(app, navigate);
}
