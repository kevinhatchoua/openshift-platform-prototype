import type { VercelRequest, VercelResponse } from "@vercel/node";

const JIRA_BASE = "https://redhat.atlassian.net/rest/api/3";

type EpicStatus = "completed" | "in-progress" | "not-started";

function epicStatusFromCategory(categoryKey: string): EpicStatus {
  if (categoryKey === "done") return "completed";
  if (categoryKey === "new") return "not-started";
  return "in-progress";
}

async function fetchIssueStatus(
  key: string,
  auth: string
): Promise<{ key: string; name: string; categoryKey: string; epicStatus: EpicStatus } | null> {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", statuses: {} });
    return;
  }

  const user = process.env.JIRA_USER ?? "khatchou@redhat.com";
  const token = process.env.JIRA_TOKEN;
  if (!token) {
    res.status(503).json({ error: "JIRA_TOKEN not configured", statuses: {} });
    return;
  }

  const raw = typeof req.query.keys === "string" ? req.query.keys : Array.isArray(req.query.keys) ? req.query.keys.join(",") : "";
  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    res.status(400).json({ error: "Missing keys query param", statuses: {} });
    return;
  }

  const auth = Buffer.from(`${user}:${token}`).toString("base64");

  try {
    const results = await Promise.all(keys.map((key) => fetchIssueStatus(key, auth)));
    const statuses: Record<string, { name: string; categoryKey: string; epicStatus: EpicStatus; resolvedKey?: string }> =
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
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ statuses });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Jira fetch failed",
      statuses: {},
    });
  }
}
