import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.resolve("tmp/olm-migration-shots");
const BASE =
  process.env.PROTOTYPE_BASE ||
  "https://openshift-platform-prototype.vercel.app";

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto(`${BASE}/ecosystem/installed-operators`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByRole("tab", { name: /Classic Operators/i }).click();
  await page.waitForTimeout(800);

  const eligibleNames = ["Elasticsearch Operator", "Kiali Operator", "Cert Manager"];
  for (const name of eligibleNames) {
    const row = page.getByRole("row", { name: new RegExp(name) });
    const cb = row.locator('input[type="checkbox"]');
    if (await cb.count()) {
      await cb.check();
    }
  }
  await page.waitForTimeout(300);

  await page.getByLabel("Bulk operator actions").click();
  await page.waitForTimeout(400);
  await page.locator(".ocs-io-toolbar-pagination-actions").screenshot({
    path: path.join(OUT, "hpux-2195-actions-dropdown.png"),
  });
  await page.keyboard.press("Escape");

  await page.getByLabel("Bulk operator actions").click();
  await page.getByRole("menuitem", { name: /Migrate to Next-Gen Operators/i }).click();
  await page.waitForTimeout(600);
  const modal = page.locator(".pf-v6-c-modal-box");
  await modal.screenshot({ path: path.join(OUT, "hpux-2195-migration-confirm.png") });

  await page.getByRole("button", { name: /Start migration/i }).click();
  await page.waitForTimeout(3500);
  await page.locator(".ocs-io-operator-table").screenshot({
    path: path.join(OUT, "hpux-2195-migration-status-column.png"),
  });

  const loggingKebab = page.getByLabel("Actions for Cluster Logging");
  if (await loggingKebab.count()) {
    await loggingKebab.click();
    const blockersItem = page.getByRole("menuitem", { name: /View migration blockers/i });
    if (await blockersItem.isVisible().catch(() => false)) {
      await blockersItem.click();
      await page.waitForTimeout(500);
      await modal.screenshot({ path: path.join(OUT, "hpux-2195-migration-blockers.png") });
      await page.getByRole("contentinfo").getByRole("button", { name: "Close" }).click();
    }
  }

  await page.getByRole("tab", { name: /Next-Gen Operators/i }).click();
  await page.waitForTimeout(800);
  const ngKebab = page.locator('[aria-label^="Actions for"]').first();
  if (await ngKebab.count()) {
    await ngKebab.click();
    const rollback = page.getByRole("menuitem", { name: /Roll back/i });
    if (await rollback.isVisible().catch(() => false)) {
      await rollback.click();
      await page.waitForTimeout(500);
      await modal.screenshot({ path: path.join(OUT, "hpux-2195-rollback-modal.png") });
    }
  }

  await browser.close();
  console.log("Saved screenshots to", OUT, "from", BASE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
