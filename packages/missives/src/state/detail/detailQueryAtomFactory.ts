import { atomFamily, unwrap } from "jotai/utils";

import { missiveDetailQueryFamily } from "./missiveDetailQueryFamily.ts";

const detailQueryAtomFamily = atomFamily((missiveId: string) =>
  unwrap(missiveDetailQueryFamily(missiveId), () => null),
);

export const detailQueryAtomFactory = (missiveId: string) =>
  detailQueryAtomFamily(missiveId);

export { detailQueryAtomFamily };

export default detailQueryAtomFactory;
