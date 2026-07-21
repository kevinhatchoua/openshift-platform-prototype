import { useEffect, useMemo, useState } from "react";
import { EPIC_CARDS, type EpicCardProps, type EpicStatus } from "./epicCardsData";

type JiraStatusPayload = {
  name: string;
  categoryKey: string;
  epicStatus: EpicStatus;
  resolvedKey?: string;
};

type StatusesResponse = {
  statuses?: Record<string, JiraStatusPayload>;
  error?: string;
};

/** Primary Jira key used to drive the card badge (first jira segment, or explicit statusKey). */
export function getCardStatusKey(card: EpicCardProps): string | undefined {
  if (card.statusKey) return card.statusKey;
  const first = card.track.find((s) => s.type === "jira");
  return first?.type === "jira" ? first.key : undefined;
}

export function collectStatusKeys(cards: EpicCardProps[] = EPIC_CARDS): string[] {
  return [...new Set(cards.map(getCardStatusKey).filter((k): k is string => Boolean(k)))];
}

/**
 * Fetches live Jira status categories via the Vite `/api/jira/statuses` proxy and
 * overlays them onto epic cards. Falls back to static `status` when unavailable.
 */
export function useEpicJiraStatuses(cards: EpicCardProps[] = EPIC_CARDS) {
  const keys = useMemo(() => collectStatusKeys(cards), [cards]);
  const [liveByKey, setLiveByKey] = useState<Record<string, EpicStatus>>({});
  const [jiraNames, setJiraNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(keys.length > 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (keys.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/jira/statuses?keys=${encodeURIComponent(keys.join(","))}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as StatusesResponse;
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? `HTTP ${res.status}`);
          setLiveByKey({});
          setJiraNames({});
          return;
        }
        const nextStatus: Record<string, EpicStatus> = {};
        const nextNames: Record<string, string> = {};
        for (const [key, payload] of Object.entries(data.statuses ?? {})) {
          if (payload?.epicStatus) nextStatus[key] = payload.epicStatus;
          if (payload?.name) nextNames[key] = payload.name;
        }
        setLiveByKey(nextStatus);
        setJiraNames(nextNames);
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setError(err instanceof Error ? err.message : "Failed to load Jira statuses");
        setLiveByKey({});
        setJiraNames({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [keys]);

  const cardsWithLiveStatus = useMemo(
    () =>
      cards.map((card) => {
        const statusKey = getCardStatusKey(card);
        const live = statusKey ? liveByKey[statusKey] : undefined;
        return live ? { ...card, status: live } : card;
      }),
    [cards, liveByKey]
  );

  return { cards: cardsWithLiveStatus, loading, error, jiraNames, liveByKey };
}
