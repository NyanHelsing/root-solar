import type { AxiomRecord } from "@root-solar/api";

import cloneTag from "./cloneTag.ts";
import type { MissiveRecord } from "../types.ts";

const withDerivedFields = (record: AxiomRecord): MissiveRecord => ({
    ...record,
    tags: record.tags.map(cloneTag),
});

export default withDerivedFields;
