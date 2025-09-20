import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import { SearchAndBrowseApp } from "./App.tsx";

import "../../shared/styles/global.css";

console.error("RUNNING SNB BOOTSTRAP");

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SearchAndBrowseApp />
  </BrowserRouter>,
);
