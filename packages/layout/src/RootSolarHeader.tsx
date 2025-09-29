import type { ReactNode } from "react";
import { Link } from "react-router";

import {
  FlareBrandMark,
  FlareHeaderBar,
  FlareStack,
  type HeaderBarTone,
} from "@root-solar/flare";

export type RootSolarNavLink = {
  href: string;
  label: ReactNode;
};

export interface RootSolarSession {
  name: string;
  profileHref?: string;
}

export interface RootSolarHeaderProps {
  brandLabel?: ReactNode;
  navLinks?: RootSolarNavLink[];
  activePath?: string;
  tone?: HeaderBarTone;
  session?: RootSolarSession | null;
  loginHref?: string;
  actions?: ReactNode;
}

const isActive = (href: string, activePath?: string) => {
  if (!activePath) {
    return false;
  }
  if (href === "/") {
    return activePath === "/";
  }
  return activePath.startsWith(href);
};

const RootSolarHeader = ({
  brandLabel = "root.solar",
  navLinks,
  activePath,
  tone = "surface",
  session,
  loginHref = "/auth",
  actions,
}: RootSolarHeaderProps) => {
  const navContent = navLinks && navLinks.length > 0 ? (
    <nav aria-label="Primary">
      <FlareStack direction="row" gap="md" align="center" wrap>
        {navLinks.map((link) => {
          const active = isActive(link.href, activePath);
          return (
            <Link
              key={link.href}
              className="rs-link"
              to={link.href}
              aria-current={active ? "page" : undefined}
              style={{
                color: active ? "rgba(59, 130, 246, 0.9)" : undefined,
                textDecorationColor: active ? "rgba(59, 130, 246, 0.9)" : undefined,
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </FlareStack>
    </nav>
  ) : null;

  const profileDestination = session?.profileHref ?? loginHref ?? "/auth";
  const sessionInitial = session?.name?.trim().charAt(0).toUpperCase() || "?";

  const sessionNode = session ? (
    <Link
      to={profileDestination}
      className="rs-inline-stack"
      style={{
        gap: "0.5rem",
        textDecoration: "none",
        color: "var(--flare-text)",
      }}
      aria-label={`Open profile for ${session.name}`}
    >
      <span
        aria-hidden="true"
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "999px",
          background: "rgba(59, 130, 246, 0.16)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          color: "rgba(37, 99, 235, 1)",
        }}
      >
        {sessionInitial}
      </span>
      <span className="rs-text-soft">{session.name}</span>
    </Link>
  ) : (
    <Link to={loginHref} className="rs-link">
      Log in
    </Link>
  );

  const headerActions = (
    <FlareStack direction="row" align="center" gap="md">
      {navContent}
      {actions}
      {sessionNode}
    </FlareStack>
  );

  return (
    <FlareHeaderBar
      tone={tone}
      brand={
        <Link to="/" className="rs-inline-stack">
          <FlareBrandMark />
          <span className="rs-text-brand">{brandLabel}</span>
        </Link>
      }
      actions={headerActions}
    />
  );
};

export default RootSolarHeader;
