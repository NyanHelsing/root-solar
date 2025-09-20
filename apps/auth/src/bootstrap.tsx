import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import { AuthApp } from "./App.tsx";

import "../../shared/styles/global.css";

console.error("RUNNING AUTH BOOTSTRAP");

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthApp />
  </BrowserRouter>,
);
