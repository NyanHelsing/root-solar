import type { SentimentNetwork, SentimentNetworkStatus } from "./types.ts";

let network: SentimentNetwork | null = null;
let unsubscribe: (() => void) | undefined;
let currentStatus: SentimentNetworkStatus = { state: "offline" };

export const registerSentimentNetwork = (instance: SentimentNetwork) => {
  network = instance;
  unsubscribe?.();
  const status = instance.getStatus?.();
  if (status) {
    currentStatus = status;
  }
  const off = instance.onStatusChange?.((status) => {
    currentStatus = status;
  });
  unsubscribe = typeof off === "function" ? off : undefined;
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
