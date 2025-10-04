import type { ComponentType } from "react";

import { toComponentSlug } from "./utils/slug.ts";

type RegisteredComponent = ComponentType<Record<string, unknown>>;

const registry = new Map<string, RegisteredComponent>();

const toArray = (value: string | string[]): string[] => (Array.isArray(value) ? value : [value]);

export const registerComponent = <Props>(
    names: string | string[],
    component: ComponentType<Props>
): void => {
    const entries = toArray(names);
    for (const entry of entries) {
        const key = toComponentSlug(entry);
        registry.set(key, component as RegisteredComponent);
    }
};

export const resolveComponent = (name: string): RegisteredComponent | undefined => {
    const key = toComponentSlug(name);
    return registry.get(key);
};

export const listRegisteredComponents = (): string[] => Array.from(registry.keys());
