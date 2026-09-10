import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // The integration tests (lib/**/*.test.ts) share one real Postgres
    // database rather than mocking it — by design, since the whole point
    // is proving real concurrency behavior (race conditions) the database
    // itself enforces. Running test *files* in parallel means each opens
    // its own connection pool against that same database simultaneously,
    // which is a separate, uninteresting kind of concurrency that only
    // adds connection contention without testing anything. Sequential
    // file execution avoids that entirely; it's a handful of integration
    // tests, not a large suite, so the time cost is negligible.
    fileParallelism: false,
    // Without this, each test file still gets its own module registry (and
    // so its own lib/db.ts Prisma client + connection pool) even with
    // fileParallelism off — several short-lived pools opening in sequence
    // against the same fragile local dev database, rather than the one
    // long-lived pool the app itself uses. Sharing state across files is
    // exactly what lib/db.ts's globalForPrisma caching is already for.
    isolate: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      // The `server-only` package throws unconditionally unless resolved
      // via its package.json's `react-server` export condition, which
      // Next.js's bundler sets and Vitest doesn't. `empty.js` is that same
      // condition's own target — the package's real no-op, not a stub we
      // invented — so lib/ modules guarded by `import "server-only"` can
      // be imported directly by integration tests (see lib/*/*.test.ts).
      "server-only": path.resolve(
        import.meta.dirname,
        "node_modules/server-only/empty.js",
      ),
    },
  },
});
