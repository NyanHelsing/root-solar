import { useEffect, useState } from "react";

import { client } from "../api/client.ts";
import type { SentimentNetworkStatus } from "../net/index.ts";

const DEFAULT_STATUS: SentimentNetworkStatus = { state: "starting" };

const getErrorStatus = (error: unknown): SentimentNetworkStatus => ({
  state: "error",
  message: error instanceof Error
    ? error.message
    : "Unable to load network status",
});

export const useSentimentNetworkStatus = (pollIntervalMs = 5000) => {
  const [status, setStatus] = useState<SentimentNetworkStatus>(DEFAULT_STATUS);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const poll = async () => {
      try {
        const latest = await client.networkStatus.query();
        if (!cancelled) {
          setStatus(latest);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(getErrorStatus(error));
        }
      } finally {
        if (!cancelled) {
          timeoutId = window.setTimeout(poll, pollIntervalMs);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pollIntervalMs]);

  return status;
};
