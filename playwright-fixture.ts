// Fixture standalone — re-exporta diretamente do @playwright/test para que
// os specs rodem mesmo sem o pacote `lovable-agent-playwright-config`.
export { test, expect, type Page } from "@playwright/test";
