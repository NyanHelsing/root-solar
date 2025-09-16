import { useMemo } from "react";

import styles from "./NetworkStatusIndicator.module.scss";
import { useSentimentNetworkStatus } from "./hooks/useSentimentNetworkStatus.ts";
import type { SentimentNetworkStatus } from "./net/index.ts";

const getStatusLabel = (status: SentimentNetworkStatus) => {
  switch (status.state) {
    case "ready":
      return status.peerId ? `P2P online (${status.peerId.slice(0, 6)}…)` : "P2P online";
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
};

const getStatusTitle = (status: SentimentNetworkStatus) => {
  if (status.state === "error") {
    return status.message;
  }
  if (status.state === "ready") {
    return `Protocol ${status.protocol}`;
  }
  return undefined;
};

const stateClassMap: Record<SentimentNetworkStatus["state"], string> = {
  ready: styles.ready,
  starting: styles.starting,
  error: styles.error,
  stopped: styles.offline,
  offline: styles.offline,
};

export default function NetworkStatusIndicator() {
  const status = useSentimentNetworkStatus();

  const label = useMemo(() => getStatusLabel(status), [status]);
  const title = useMemo(() => getStatusTitle(status), [status]);
  const stateClass = useMemo(() => stateClassMap[status.state] ?? styles.offline, [status]);

  return (
    <div className={styles.indicator} aria-live="polite" title={title}>
      <span aria-hidden="true" className={`${styles.dot} ${stateClass}`} />
      <span className={styles.text}>{label}</span>
    </div>
  );
}
