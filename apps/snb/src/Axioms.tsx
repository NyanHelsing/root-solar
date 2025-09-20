import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { FlareStack } from "@root-solar/flare";
import Axiom from "./Axiom.tsx";

import {
  axiomsAtom,
  axiomsLoadingAtom,
  axiomsTotalWeightAtom,
  loadAxiomsAtom,
} from "./features/axioms/store.ts";

export default function Axioms() {
  const axioms = useAtomValue(axiomsAtom);
  const totalWeight = useAtomValue(axiomsTotalWeightAtom);
  const isLoading = useAtomValue(axiomsLoadingAtom);
  const loadAxioms = useSetAtom(loadAxiomsAtom);

  useEffect(() => {
    loadAxioms();
  }, [loadAxioms]);

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
