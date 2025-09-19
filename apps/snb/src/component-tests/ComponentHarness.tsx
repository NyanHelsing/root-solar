import type { ComponentType, ReactElement } from "react";
import { useMemo } from "react";

import Axiom from "../Axiom.tsx";
import Axioms from "../Axioms.tsx";
import Footer from "../Footer.tsx";
import Header from "../Header.tsx";
import Hero from "../Hero.tsx";
import Main from "../Main.tsx";
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

  return (
    <div data-component-root>
      <Component {...(componentProps ?? {})} />
    </div>
  );
};

export default ComponentHarness;
