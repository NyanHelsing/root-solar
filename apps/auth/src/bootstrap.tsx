import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import { AuthApp } from "./App.tsx";

import "@root-solar/flare/styles/base";
import "@root-solar/flare/styles/utilities";

console.error("RUNNING AUTH BOOTSTRAP");

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Unable to locate #root element for rendering");
}

createRoot(rootElement).render(
    <BrowserRouter>
        <AuthApp />
    </BrowserRouter>
);
