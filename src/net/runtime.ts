import type { SentimentNetwork, SentimentNetworkStatus } from "./index.ts";

let network: SentimentNetwork | null = null;
let unsubscribe: (() => void) | undefined;
let currentStatus: SentimentNetworkStatus = { state: "offline" };

export const registerSentimentNetwork = (instance: SentimentNetwork) => {
  network = instance;
  unsubscribe?.();
  currentStatus = instance.getStatus();
  unsubscribe = instance.onStatusChange((status) => {
    currentStatus = status;
  });
};

export const clearSentimentNetwork = () => {
  unsubscribe?.();
  unsubscribe = undefined;
  network = null;
  currentStatus = { state: "offline" };
};

export const setSentimentNetworkStatus = (status: SentimentNetworkStatus) => {
  currentStatus = status;
};

export const getSentimentNetworkStatus = (): SentimentNetworkStatus => currentStatus;

export const getSentimentNetwork = () => network;
