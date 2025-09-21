import { Route, Routes } from "react-router";

import Axioms from "./Axioms.tsx";
import AxiomDetail from "./AxiomDetail.tsx";

export default function Main() {
  return (
    <Routes>
      <Route index element={<Axioms />} />
      <Route path=":axiomId" element={<AxiomDetail />} />
    </Routes>
  );
}
