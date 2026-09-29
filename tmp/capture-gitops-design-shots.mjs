import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT =
  process.env.OUT_DIR ||
  "/Users/khatchou/.workspace-mcp/attachments";
const BASE =
  process.env.PROTOTYPE_BASE ||
  "https://openshift-platform-prototype.vercel.app";

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto(`${BASE}/gitops/overview`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT, "gitops-dashboard-overview.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/gitops/ns/argocd/rollouts/rollout-canary-api`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  await page.getByRole("tab", { name: /Experiments/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT, "gitops-rollout-experiments-tab.png"),
    fullPage: false,
  });

  await page.getByRole("tab", { name: /Analysis runs/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT, "gitops-rollout-analysis-runs-tab.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("Saved GitOps shots to", OUT, "from", BASE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
