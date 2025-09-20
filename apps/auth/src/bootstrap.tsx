import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import { AuthApp } from "./App.tsx";

import "@root-solar/flare/styles/base";
import "@root-solar/flare/styles/utilities";

console.error("RUNNING AUTH BOOTSTRAP");

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthApp />
  </BrowserRouter>,
);
