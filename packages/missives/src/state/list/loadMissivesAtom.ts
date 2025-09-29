import { atom } from "jotai";

import { missivesQueryAtom } from "./missivesQueryAtom.ts";
import { sentimentsQueryAtom } from "./sentimentsQueryAtom.ts";

export const loadMissivesAtom = atom(
  null,
  async (_get, set) => {
    set(missivesQueryAtom);
    set(sentimentsQueryAtom);
  },
);

export default loadMissivesAtom;
