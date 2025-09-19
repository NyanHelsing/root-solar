declare module "snb/App" {
  import type { ComponentType } from "react";

  export const Header: ComponentType;
  export const Hero: ComponentType;
  export const Main: ComponentType;
  export const Footer: ComponentType;
  export const ComponentHarness: ComponentType<{ componentName?: string }>;
  export function SearchAndBrowseApp(): JSX.Element;
}
