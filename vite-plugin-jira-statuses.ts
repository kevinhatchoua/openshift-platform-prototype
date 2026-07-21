import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Plugin, Connect } from "vite";

const JIRA_BASE = "https://redhat.atlassian.net/rest/api/3";
const JIRA_USER = process.env.JIRA_USER ?? "khatchou@redhat.com";
const TOKEN_FILE = process.env.JIRA_TOKEN_FILE ?? path.join(os.homedir(), ".jira-token");

type CategoryKey = "done" | "indeterminate" | "new" | string;

function epicStatusFromCategory(categoryKey: CategoryKey): "completed" | "in-progress" | "not-started" {
  if (categoryKey === "done") return "completed";
  if (categoryKey === "new") return "not-started";
  return "in-progress";
}

function readToken(): string | null {
  try {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim() || null;
  } catch {
    return null;
  }
}

async function fetchIssueStatus(
  key: string,
  auth: string
): Promise<{ key: string; name: string; categoryKey: string; epicStatus: string } | null> {
  const res = await fetch(`${JIRA_BASE}/issue/${encodeURIComponent(key)}?fields=status`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    key?: string;
    fields?: { status?: { name?: string; statusCategory?: { key?: string } } };
  };
  const name = data.fields?.status?.name ?? "Unknown";
  const categoryKey = data.fields?.status?.statusCategory?.key ?? "indeterminate";
  return {
    key: data.key ?? key,
    name,
    categoryKey,
    epicStatus: epicStatusFromCategory(categoryKey),
  };
}

function jiraStatusesMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url ?? "";
    if (!url.startsWith("/api/jira/statuses")) {
      next();
      return;
    }

    res.setHeader("Content-Type", "application/json");

    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const token = readToken();
    if (!token) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: "Jira token unavailable", statuses: {} }));
      return;
    }

    const qs = new URL(url, "http://localhost").searchParams;
    const keys = (qs.get("keys") ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Missing keys query param", statuses: {} }));
      return;
    }

    const auth = Buffer.from(`${JIRA_USER}:${token}`).toString("base64");

    try {
      const results = await Promise.all(keys.map((key) => fetchIssueStatus(key, auth)));
      const statuses: Record<string, { name: string; categoryKey: string; epicStatus: string; resolvedKey?: string }> =
        {};
      keys.forEach((requestedKey, i) => {
        const result = results[i];
        if (!result) return;
        statuses[requestedKey] = {
          name: result.name,
          categoryKey: result.categoryKey,
          epicStatus: result.epicStatus,
          ...(result.key !== requestedKey ? { resolvedKey: result.key } : {}),
        };
      });
      res.statusCode = 200;
      res.end(JSON.stringify({ statuses }));
    } catch (err) {
      res.statusCode = 502;
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : "Jira fetch failed",
          statuses: {},
        })
      );
    }
  };
}

/** Dev/preview middleware: GET /api/jira/statuses?keys=HPUX-1,HPUX-2 */
export function jiraStatusesPlugin(): Plugin {
  return {
    name: "jira-statuses-api",
    configureServer(server) {
      server.middlewares.use(jiraStatusesMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(jiraStatusesMiddleware());
    },
  };
}
