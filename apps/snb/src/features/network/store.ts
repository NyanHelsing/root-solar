import { atom } from "jotai";

import { client } from "@root-solar/api/client";
import type { NetworkStatus } from "@root-solar/net/status";

const defaultStatus: NetworkStatus = { state: "starting" };

export const networkStatusAtom = atom<NetworkStatus>(defaultStatus);

export const refreshNetworkStatusAtom = atom(null, async (_get, set) => {
    try {
        const status = await client.networkStatus.query();
        set(networkStatusAtom, status);
    } catch (error) {
        set(networkStatusAtom, {
            state: "error",
            message: error instanceof Error ? error.message : "Unable to load network status",
        });
    }
});
