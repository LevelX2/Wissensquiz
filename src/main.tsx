import React from "react";
import { createRoot } from "react-dom/client";
import { AccountApp } from "./AccountApp";
import { PageBoundary } from "./PageBoundary";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PageBoundary scope="app">
      <AccountApp />
    </PageBoundary>
  </React.StrictMode>,
);
