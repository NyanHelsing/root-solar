import { Navigate, Route, Routes, useLocation } from "react-router";

import { MissiveDetail, MissiveList } from "@root-solar/declarations";

type RouteContext = {
  basePath: "/missives" | "/axioms";
  kind?: "axiom";
};

const resolveRouteContext = (pathname: string): RouteContext => {
  if (pathname.startsWith("/axioms")) {
    return { basePath: "/axioms", kind: "axiom" };
  }
  return { basePath: "/missives" };
};

export default function Main() {
  const location = useLocation();
  const { basePath, kind } = resolveRouteContext(location.pathname);

  return (
    <Routes>
      <Route index element={<MissiveList kind={kind} basePath={basePath} />} />
      <Route
        path=":missiveId"
        element={
          <MissiveDetail
            kind={kind}
            basePath={basePath}
            paramKey="missiveId"
          />
        }
      />
      <Route path="/" element={<Navigate to="/missives" replace />} />
      <Route path="/missives" element={<MissiveList basePath="/missives" />} />
      <Route
        path="/missives/:missiveId"
        element={<MissiveDetail basePath="/missives" paramKey="missiveId" />}
      />
      <Route
        path="/axioms"
        element={<MissiveList kind="axiom" basePath="/axioms" />}
      />
      <Route
        path="/axioms/:missiveId"
        element={
          <MissiveDetail
            kind="axiom"
            basePath="/axioms"
            paramKey="missiveId"
          />
        }
      />
      <Route path="*" element={<Navigate to={basePath} replace />} />
    </Routes>
  );
}
