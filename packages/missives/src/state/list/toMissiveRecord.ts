import type { AxiomRecord } from "@root-solar/api";

import withDerivedFields from "../../utils/withDerivedFields.ts";
import type { MissiveRecord } from "../../types.ts";

export const toMissiveRecord = (record: AxiomRecord): MissiveRecord => withDerivedFields(record);

export default toMissiveRecord;
