import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { SearchAndBrowseApp } from "./App.tsx";

import "../../shared/styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Unable to locate #root element for the SNB micro frontend");
}

createRoot(rootElement).render(
  <StrictMode>
    <SearchAndBrowseApp />
  </StrictMode>,
);
