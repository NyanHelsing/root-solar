import type { BeingCredentialBundle } from "../credentials.ts";

export const encodeBundle = (bundle: BeingCredentialBundle): string => JSON.stringify(bundle);

export default encodeBundle;
