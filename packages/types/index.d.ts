/// <reference path="../../apps/shell/src/remote.d.ts" />

declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.scss" {
  const styles: Record<string, string> | string;
  export default styles;
}

declare module "*.css" {
  const styles: Record<string, string> | string;
  export default styles;
}

declare module "@root-solar/flare/styles/*" {
  const styles: string;
  export default styles;
}
