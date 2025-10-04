import type { HTMLAttributes, ReactNode } from "react";

import PageSection from "../PageSection/PageSection.tsx";
import Stack from "../Stack/Stack.tsx";

import styles from "./Footer.module.scss";

export interface FooterLink {
    label: ReactNode;
    href: string;
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
    links?: FooterLink[];
    meta?: ReactNode;
}

const Footer = ({ links, meta, className, ...rest }: FooterProps) => {
    const fallbackMeta =
        meta === undefined ? `© ${new Date().getFullYear().toString()} root.solar` : meta;

    return (
        <footer className={[styles.footer, className].filter(Boolean).join(" ")} {...rest}>
            <PageSection as="div" paddingBlock="2.5rem">
                <Stack align="center" gap="sm">
                    {links && links.length > 0 ? (
                        <nav className={styles.links} aria-label="Footer">
                            {links.map((link) => (
                                <a key={link.href} className="rs-link" href={link.href}>
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    ) : null}
                    {fallbackMeta ? <div className={styles.meta}>{fallbackMeta}</div> : null}
                </Stack>
            </PageSection>
        </footer>
    );
};

export default Footer;
