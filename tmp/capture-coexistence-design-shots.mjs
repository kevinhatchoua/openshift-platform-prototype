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

  await page.goto(`${BASE}/ecosystem/software-catalog`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT, "hpux-2190-catalog-unified.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/ecosystem/software-catalog?catalog=classic`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT, "hpux-2190-catalog-classic.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/ecosystem/installed-operators`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT, "hpux-2191-io-nextgen-lifecycle.png"),
    fullPage: false,
  });

  await page.getByRole("tab", { name: /Classic Operators/i }).click();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT, "hpux-2191-io-classic-tab.png"),
    fullPage: false,
  });

  await page.getByLabel("Bulk operator actions").click();
  await page.waitForTimeout(400);
  await page.locator(".ocs-io-toolbar-pagination-actions").screenshot({
    path: path.join(OUT, "hpux-2191-io-actions-dropdown.png"),
  });
  await page.keyboard.press("Escape");

  const ngName = "OpenShift GitOps (cluster extension)";
  await page.getByRole("tab", { name: /Next-Gen Operators/i }).click();
  await page.waitForTimeout(600);
  await page.getByLabel(`Actions for ${ngName}`).click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT, "hpux-2225-io-kebab-actions.png"),
    clip: { x: 1200, y: 400, width: 720, height: 420 },
  });
  await page.getByRole("menuitem", { name: /Unsubscribe from updates/i }).click();
  await page.waitForTimeout(500);
  await page.locator(".pf-v6-c-modal-box").screenshot({
    path: path.join(OUT, "hpux-2225-unsubscribe-modal.png"),
  });
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByLabel(`Actions for ${ngName}`).click();
  await page.getByRole("menuitem", { name: /Delete extension and managed resources/i }).click();
  await page.waitForTimeout(500);
  await page.locator(".pf-v6-c-modal-box").screenshot({
    path: path.join(OUT, "hpux-2225-delete-modal.png"),
  });
  await page.keyboard.press("Escape");

  await page.goto(
    `${BASE}/ecosystem/installed-operators/${encodeURIComponent(ngName)}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT, "hpux-2225-detail-actions.png"),
    fullPage: false,
  });

  await page.getByRole("button", { name: /Actions/i }).first().click();
  await page.getByRole("menuitem", { name: /Update to/i }).first().click();
  await page.waitForTimeout(500);
  await page.locator(".pf-v6-c-modal-box").screenshot({
    path: path.join(OUT, "hpux-2192-update-modal-detail.png"),
  });

  await browser.close();
  console.log("Saved coexistence shots to", OUT, "from", BASE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
