import { useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import styles from "./NetworkStatusIndicator.module.scss";
import {
  networkStatusAtom,
  refreshNetworkStatusAtom,
  type NetworkStatus,
} from "./store.ts";

const getLabel = (status: NetworkStatus) => {
  switch (status.state) {
    case "ready":
      return status.peerId ? `P2P online (${status.peerId.slice(0, 6)}…)` : "P2P online";
    case "starting":
      return "P2P starting";
    case "error":
      return "P2P error";
    case "offline":
    default:
      return "P2P offline";
  }
};

const getTitle = (status: NetworkStatus) => {
  if (status.state === "error") {
    return status.message;
  }
  if (status.state === "ready") {
    return status.protocol ? `Protocol ${status.protocol}` : undefined;
  }
  return undefined;
};

const stateClasses: Record<NetworkStatus["state"], string> = {
  ready: styles.ready,
  starting: styles.starting,
  error: styles.error,
  offline: styles.offline,
};

export default function NetworkStatusIndicator() {
  const status = useAtomValue(networkStatusAtom);
  const refreshStatus = useSetAtom(refreshNetworkStatusAtom);

  useEffect(() => {
    refreshStatus();
    const interval = window.setInterval(() => {
      refreshStatus();
    }, 5000);
    return () => {
      window.clearInterval(interval);
    };
  }, [refreshStatus]);

  const label = useMemo(() => getLabel(status), [status]);
  const title = useMemo(() => getTitle(status), [status]);
  const dotClass = useMemo(() => stateClasses[status.state] ?? styles.offline, [status]);

  return (
    <div className={styles.indicator} aria-live="polite" title={title}>
      <span aria-hidden="true" className={`${styles.dot} ${dotClass}`} />
      <span className={styles.text}>{label}</span>
    </div>
  );
}
