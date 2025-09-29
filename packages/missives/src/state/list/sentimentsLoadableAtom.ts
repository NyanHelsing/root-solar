import { loadable } from "jotai/utils";

import { sentimentsQueryAtom } from "./sentimentsQueryAtom.ts";

export const sentimentsLoadableAtom = loadable(sentimentsQueryAtom);

export default sentimentsLoadableAtom;
