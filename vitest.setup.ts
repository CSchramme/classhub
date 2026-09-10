import "dotenv/config";
import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia; next-themes (system theme detection)
// needs it. Minimal stub is enough for tests — no real media query support.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
