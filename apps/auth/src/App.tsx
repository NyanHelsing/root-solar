import type { ComponentType } from "react";
import { Route } from "react-router";

import AuthRoute from "./AuthRoute.tsx";

export type ShellRouteComponent = ComponentType;

export const shellRouteConfig = {
    path: "/auth",
    Component: AuthRoute as ShellRouteComponent,
} as const;

export const AuthApp = () => <AuthRoute />;

export const ShellRoutes = () => <Route path={shellRouteConfig.path} element={<AuthRoute />} />;

export default AuthApp;
