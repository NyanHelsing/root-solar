import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import { SearchAndBrowseApp } from "./App.tsx";

import "@root-solar/flare/styles/base";
import "@root-solar/flare/styles/utilities";

console.error("RUNNING SNB BOOTSTRAP");

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SearchAndBrowseApp />
  </BrowserRouter>,
);
