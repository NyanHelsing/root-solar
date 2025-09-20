import type { ReactNode } from "react";

import styles from "./ShellLayout.module.scss";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/axioms", label: "Axioms" },
  { href: "/auth", label: "Auth" },
] as const;

export type ShellLayoutProps = {
  hero?: ReactNode;
  children?: ReactNode;
  activePath?: string;
};

const isActive = (candidate: string, activePath?: string) => {
  if (!activePath) {
    return false;
  }
  if (candidate === "/") {
    return activePath === "/";
  }
  return activePath.startsWith(candidate);
};

export const ShellLayout = ({ hero, children, activePath }: ShellLayoutProps) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <a className={styles.logo} href="/">
          root.solar
        </a>
        <nav className={styles.nav} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={styles.link}
              data-active={isActive(item.href, activePath) ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      {hero ? <div className={styles.heroRegion}>{hero}</div> : null}
      {children ? <main className={styles.main}>{children}</main> : null}
      <footer className={styles.footer}>
        <small>© {new Date().getFullYear()} root.solar</small>
      </footer>
    </div>
  );
};

export default ShellLayout;
