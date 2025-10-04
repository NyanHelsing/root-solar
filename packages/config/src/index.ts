// TODO: split the functions defined in this module out to individual files
// in order to make them easier to test and maintain.

import { useEffect } from "react";
import { atom, createStore, useAtomValue, useSetAtom } from "jotai";

export type AppConfig = Record<string, unknown>;

const defaultConfig: AppConfig = {};

const configAtom = atom<AppConfig>(defaultConfig);
const configStore = createStore();

type ConfigInput<TConfig extends AppConfig> = TConfig | ((previous: AppConfig) => TConfig);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const mergeConfig = (previous: AppConfig, next: AppConfig): AppConfig => {
    if (previous === next) {
        return previous;
    }

    const result: AppConfig = { ...previous };

    for (const [key, value] of Object.entries(next)) {
        const previousValue = previous[key];

        if (value === undefined) {
            continue;
        }

        if (isRecord(previousValue) && isRecord(value)) {
            result[key] = { ...previousValue, ...value };
            continue;
        }

        result[key] = value;
    }

    return result;
};

export const useConfig = <TConfig = AppConfig>() =>
    useAtomValue(configAtom, { store: configStore }) as TConfig;

export const useInitializeConfig = <TConfig extends AppConfig>(
    config: ConfigInput<TConfig>,
    dependencies: ReadonlyArray<unknown> = [],
) => {
    const setConfig = useSetAtom(configAtom, { store: configStore });

    useEffect(() => {
        setConfig((previous) => {
            const nextConfig =
                typeof config === "function"
                    ? (config as (prev: AppConfig) => AppConfig)(previous)
                    : config;

            return mergeConfig(previous, nextConfig);
        });
    }, [setConfig, config, ...dependencies]);
};

export const readConfig = <TConfig = AppConfig>() => configStore.get(configAtom) as TConfig;

export const updateConfig = <TConfig extends AppConfig>(config: ConfigInput<TConfig>) => {
    configStore.set(configAtom, (previous) => {
        const nextConfig =
            typeof config === "function"
                ? (config as (prev: AppConfig) => AppConfig)(previous)
                : config;

        return mergeConfig(previous, nextConfig);
    });
};

export const resetConfig = () => {
    configStore.set(configAtom, defaultConfig);
};

export { configAtom, configStore };
