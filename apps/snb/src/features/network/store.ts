import { atom } from "jotai";

import { client } from "@root-solar/api/client";

export type NetworkStatus =
  | { state: "offline" }
  | { state: "starting" }
  | { state: "ready"; protocol?: string; peerId?: string }
  | { state: "error"; message: string };

const defaultStatus: NetworkStatus = { state: "starting" };

export const networkStatusAtom = atom<NetworkStatus>(defaultStatus);

export const refreshNetworkStatusAtom = atom(null, async (_get, set) => {
  try {
    const status = await client.networkStatus.query();
    set(networkStatusAtom, status satisfies NetworkStatus ? status : defaultStatus);
  } catch (error) {
    set(networkStatusAtom, {
      state: "error",
      message: error instanceof Error ? error.message : "Unable to load network status",
    });
  }
});
