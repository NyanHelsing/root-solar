import type { ComponentType, ReactElement } from "react";
import { useMemo } from "react";
import { MemoryRouter } from "react-router";

import Axiom from "../Axiom.tsx";
import Axioms from "../Axioms.tsx";
import Main from "../Main.tsx";
import {
  RootSolarFooter as Footer,
  RootSolarHeader as Header,
  ShellHero as Hero,
} from "@root-solar/layout";
import NetworkStatusIndicator from "../features/network/NetworkStatusIndicator.tsx";

const registry: Record<string, ComponentType<Record<string, unknown>>> = {
  axiom: Axiom,
  axioms: Axioms,
  footer: Footer,
  header: Header,
  hero: Hero,
  main: Main,
  "network-status-indicator": NetworkStatusIndicator,
};

const normalizeKey = (value: string): string =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const parseProps = (search: string): Record<string, unknown> | undefined => {
  if (!search) {
    return undefined;
  }

  const params = new URLSearchParams(search);
  const raw = params.get("props");

  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const ComponentHarness = ({
  componentName,
}: {
  componentName?: string;
}): ReactElement => {
  const search = typeof window === "undefined" ? "" : window.location.search;
  const componentProps = useMemo(() => parseProps(search), [search]);
  const key = componentName ? normalizeKey(componentName) : "";
  const Component = registry[key];

  if (!Component) {
    return (
      <div data-component-root role="alert">
        Unknown component: {componentName ?? "(unspecified)"}
      </div>
    );
  }

  type HarnessProps = Record<string, unknown> & { initialPath?: unknown };
  const resolvedProps: HarnessProps | undefined = componentProps
    ? ({ ...componentProps } as HarnessProps)
    : undefined;

  let initialPath = "/";
  if (resolvedProps && typeof resolvedProps.initialPath === "string") {
    initialPath = resolvedProps.initialPath;
    delete resolvedProps.initialPath;
  }

  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <div data-component-root>
        <Component {...(resolvedProps ?? {})} />
      </div>
    </MemoryRouter>
  );
};

export default ComponentHarness;
