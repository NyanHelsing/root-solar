declare module "snb/App" {
  import type { ComponentType, ReactElement } from "react";

  export interface ShellRouteConfig {
    path: string;
    Component: ComponentType;
  }

  export const Header: ComponentType;
  export const Hero: ComponentType;
  export const Main: ComponentType;
  export const Footer: ComponentType;
  export const ComponentHarness: ComponentType<{ componentName?: string }>;
  export const shellRouteConfig: ShellRouteConfig;
  export const ShellRoutes: ComponentType;
  export function SearchAndBrowseApp(): ReactElement;
}

declare module "auth/App" {
  import type { ComponentType } from "react";

  export interface ShellRouteConfig {
    path: string;
    Component: ComponentType;
  }

  const AuthApp: ComponentType;
  export default AuthApp;
  export { AuthApp };
  export const shellRouteConfig: ShellRouteConfig;
  export const ShellRoutes: ComponentType;
}
