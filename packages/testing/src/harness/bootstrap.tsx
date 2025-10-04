import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@root-solar/flare/styles/base";
import "@root-solar/flare/styles/utilities";

import HarnessApp from "./App.tsx";
import "../components/index.ts";

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Unable to locate #root element for testing harness");
}

createRoot(rootElement).render(
    <StrictMode>
        <HarnessApp />
    </StrictMode>
);
