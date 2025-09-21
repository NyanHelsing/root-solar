import { type ReactNode } from "react";

import { FlarePageSection, FlareStack } from "@root-solar/flare";

import RootSolarFooter, {
  type RootSolarFooterProps,
} from "./RootSolarFooter.tsx";
import RootSolarHeader, {
  type RootSolarHeaderProps,
  type RootSolarNavLink,
  type RootSolarSession,
} from "./RootSolarHeader.tsx";

const DEFAULT_NAV_LINKS: RootSolarNavLink[] = [
  { href: "/missives", label: "Missives" },
  { href: "/axioms", label: "Axioms" },
];

export interface ShellLayoutProps {
  hero?: ReactNode;
  children?: ReactNode;
  activePath?: string;
  navLinks?: RootSolarNavLink[];
  headerActions?: RootSolarHeaderProps["actions"];
  footerLinks?: RootSolarFooterProps["links"];
  footerMeta?: RootSolarFooterProps["meta"];
  mainMaxWidth?: string;
  mainPaddingBlock?: string;
  session?: RootSolarSession | null;
  loginHref?: string;
}

export const ShellLayout = ({
  hero,
  children,
  activePath,
  navLinks,
  headerActions,
  footerLinks,
  footerMeta,
  mainMaxWidth = "72rem",
  mainPaddingBlock = "3rem",
  session,
  loginHref,
}: ShellLayoutProps) => {
  return (
    <FlareStack
      gap="none"
      fullWidth
      style={{
        minHeight: "100vh",
        background: "var(--flare-body-background)",
      }}
    >
      <RootSolarHeader
        navLinks={navLinks ?? DEFAULT_NAV_LINKS}
        activePath={activePath}
        actions={headerActions}
        session={session}
        loginHref={loginHref}
      />
      {hero}
      {children ? (
        <FlarePageSection
          as="main"
          maxWidth={mainMaxWidth}
          paddingBlock={mainPaddingBlock}
          style={{ flex: "1 0 auto" }}
        >
          {children}
        </FlarePageSection>
      ) : null}
      <RootSolarFooter links={footerLinks} meta={footerMeta} />
    </FlareStack>
  );
};

export default ShellLayout;
