import { useEffect } from "react";

import { FlareStack } from "@root-solar/flare";
import {
  useAxiomsOverview,
  useAxiomsTotalWeight,
  useAxiomsListLoading,
  useAxiomsListError,
  useLoadAxioms,
  useBeing,
} from "@root-solar/declarations";
import Axiom from "./Axiom.tsx";

export default function Axioms() {
  const being = useBeing();
  const axioms = useAxiomsOverview();
  const totalWeight = useAxiomsTotalWeight();
  const isLoading = useAxiomsListLoading();
  const error = useAxiomsListError();
  const loadAxioms = useLoadAxioms();

  useEffect(() => {
    void loadAxioms();
  }, [loadAxioms, being.id]);

  return (
    <FlareStack gap="lg">
      <FlareStack as="header" gap="sm">
        <h1 className="rs-heading-xl">Aggregate Prioritization</h1>
        <p className="rs-text-body-lg rs-text-soft">
          Calculated by summing the weights of individual participant's priorities
        </p>
        <p className="rs-text-soft">
          Total personal allocation: <strong>{totalWeight}</strong>
        </p>
      </FlareStack>
      {isLoading ? <p className="rs-text-soft">Refreshing priorities…</p> : null}
      {error ? (
        <p role="alert" className="rs-text-soft">
          {error}
        </p>
      ) : null}
      {!isLoading && axioms.length === 0 ? (
        <p className="rs-text-soft">No axioms found yet.</p>
      ) : null}
      <FlareStack gap="md">
        {axioms.map((axiom) => (
          <Axiom key={axiom.id} {...axiom} />
        ))}
      </FlareStack>
    </FlareStack>
  );
}
