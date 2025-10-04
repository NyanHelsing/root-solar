import { useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { FlareStatusIndicator, type StatusIndicatorTone } from "@root-solar/flare";
import { networkStatusAtom, refreshNetworkStatusAtom } from "./store.ts";
import type { NetworkStatus } from "@root-solar/net/status";

const getLabel = (status: NetworkStatus) => {
    switch (status.state) {
        case "ready":
            return status.peerId ? `P2P online (${status.peerId.slice(0, 6)}…)` : "P2P online";
        case "starting":
            return "P2P starting";
        case "error":
            return "P2P error";
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

const toneByState: Record<NetworkStatus["state"], StatusIndicatorTone> = {
    ready: "success",
    starting: "info",
    error: "danger",
    offline: "muted"
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
    const tone = useMemo(() => toneByState[status.state] ?? "muted", [status]);

    return <FlareStatusIndicator aria-live="polite" label={label} tone={tone} title={title} />;
}
