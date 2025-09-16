export type NetworkStatus =
  | { state: "offline" }
  | { state: "starting" }
  | { state: "ready"; protocol?: string; peerId?: string }
  | { state: "error"; message: string };

let currentStatus: NetworkStatus = { state: "offline" };

export const setNetworkStatus = (status: NetworkStatus) => {
  currentStatus = status;
};

export const getNetworkStatus = () => currentStatus;
