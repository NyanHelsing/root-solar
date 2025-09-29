import type { ReactNode } from "react";

import {
  FlareFooter,
  type FooterLink,
  type FooterProps,
} from "@root-solar/flare";

export interface RootSolarFooterProps extends Omit<FooterProps, "links"> {
  links?: FooterLink[];
  meta?: ReactNode;
}

const defaultLinks: FooterLink[] = [{ href: "/about", label: "About" }];

const RootSolarFooter = ({ links, meta, ...rest }: RootSolarFooterProps) => {
  return (
    <FlareFooter
      links={links ?? defaultLinks}
      meta={meta}
      {...rest}
    />
  );
};

export default RootSolarFooter;
