import { loadable } from "jotai/utils";

import { missivesQueryAtom } from "./missivesQueryAtom.ts";

export const missivesLoadableAtom = loadable(missivesQueryAtom);

export default missivesLoadableAtom;
