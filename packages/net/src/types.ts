import type { PeerId } from "@libp2p/interface";
import type { Libp2p } from "libp2p";
import type { AppLogger } from "@root-solar/observability";

export type SentimentFraction = {
    numerator: number;
    denominator: number;
};

export type SentimentRequest = {
    recordId: string;
};

export type SentimentResponse =
    | { status: "ok"; recordId: string; fraction: SentimentFraction }
    | { status: "not_found"; recordId: string }
    | { status: "error"; message: string; recordId?: string };

export type SentimentProvider = (recordId: string) => Promise<SentimentFraction | null>;

export interface SentimentNetworkOptions {
    libp2p: Libp2p;
    getSentiment: SentimentProvider;
    protocol?: string;
    logger?: AppLogger;
}

export type SentimentNetworkStatus =
    | { state: "offline" }
    | { state: "starting" }
    | { state: "ready"; protocol: string; peerId?: string }
    | { state: "error"; message: string };

export interface SentimentNetwork {
    protocol: string;
    querySentiment: (peerId: PeerId, recordId: string) => Promise<SentimentFraction | null>;
    close: () => Promise<void>;
    getStatus?: () => SentimentNetworkStatus;
    onStatusChange?: (
        listener: (status: SentimentNetworkStatus) => void,
    ) => (() => void) | undefined;
}

export type { AppLogger } from "@root-solar/observability";
