import { createAppLogger } from "../logging/index.ts";

export type NetworkStatus =
  | { state: "offline" }
  | { state: "starting" }
  | { state: "ready"; protocol?: string; peerId?: string }
  | { state: "error"; message: string };

let currentStatus: NetworkStatus = { state: "offline" };

const networkStatusLogger = createAppLogger("network:status", {
  tags: ["network", "status"],
});

export const setNetworkStatus = (status: NetworkStatus) => {
  currentStatus = status;
  networkStatusLogger.info("Network status updated", {
    status,
  });
};

export const getNetworkStatus = () => currentStatus;
