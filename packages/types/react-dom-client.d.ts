declare module "react-dom/client" {
  import type { ReactNode } from "react";

  interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  function createRoot(container: Element | DocumentFragment): Root;

  export { createRoot, type Root };
}
