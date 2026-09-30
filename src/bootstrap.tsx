import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { brandRegistry } from "./brandRegistry";
import { deploymentConfig } from "./deploymentConfig";

export function bootstrap() {
  const root = document.getElementById("root");
  if (!root) throw new Error("Root element not found");

  const brand = brandRegistry[deploymentConfig.brandId];
  document.title = brand.displayName;
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) favicon.href = brand.faviconUrl;

  createRoot(root).render(
    <StrictMode>
      <App deploymentConfig={deploymentConfig} />
    </StrictMode>,
  );
}
