import { useEffect, useMemo, useState } from "react";

import styles from "./Header.module.scss";
import { client } from "./api/client.ts";
import type { SentimentNetworkStatus } from "./net/index.ts";

function RootSolarIcon() {
  return (
    <svg className={styles["root-solar-logo"]}>
      <circle r="1" cx="1" cy="1" />
    </svg>
  );
}

export default function Header() {
  const [networkStatus, setNetworkStatus] = useState<SentimentNetworkStatus>({
    state: "starting",
  });

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const status = await client.networkStatus.query();
        if (!cancelled) {
          setNetworkStatus(status);
        }
      } catch (error) {
        if (!cancelled) {
          setNetworkStatus({
            state: "error",
            message: error instanceof Error
              ? error.message
              : "Unable to load network status",
          });
        }
      }
    };

    fetchStatus();
    const interval = window.setInterval(fetchStatus, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const statusLabel = useMemo(() => {
    switch (networkStatus.state) {
      case "ready":
        return networkStatus.peerId
          ? `P2P online (${networkStatus.peerId.slice(0, 6)}…)`
          : "P2P online";
      case "starting":
        return "P2P starting";
      case "error":
        return "P2P error";
      case "stopped":
        return "P2P stopped";
      case "offline":
      default:
        return "P2P offline";
    }
  }, [networkStatus]);

  const statusTitle = useMemo(() => {
    if (networkStatus.state === "error") {
      return networkStatus.message;
    }
    if (networkStatus.state === "ready") {
      return `Protocol ${networkStatus.protocol}`;
    }
    return undefined;
  }, [networkStatus]);

  const statusClass = useMemo(() => {
    switch (networkStatus.state) {
      case "ready":
        return styles["status-ready"];
      case "error":
        return styles["status-error"];
      case "starting":
        return styles["status-starting"];
      case "stopped":
      case "offline":
      default:
        return styles["status-offline"];
    }
  }, [networkStatus]);

  return (
    <header>
      <RootSolarIcon />
      <h1>root.solar</h1>
      <div
        className={styles["status-indicator"]}
        aria-live="polite"
        title={statusTitle}
      >
        <span
          aria-hidden="true"
          className={`${styles["status-dot"]} ${statusClass}`}
        />
        <span className={styles["status-text"]}>{statusLabel}</span>
      </div>
    </header>
  );
}
