"use client";

/**
 * Last-resort fallback: only renders if the root layout itself throws
 * (e.g. font loading, ThemeProvider). Must define its own <html>/<body>
 * since it replaces the root layout when active — no ThemeProvider, no
 * Tailwind dark: variant (that needs a `.dark` class next-themes would
 * normally set on <html>), so this stays deliberately plain rather than
 * risk depending on anything the crash might have taken down with it.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          ClassHub ist gerade nicht verfügbar.
        </h1>
        <p style={{ color: "#64748b", maxWidth: "28rem" }}>
          Etwas ist beim Laden der Seite schiefgelaufen. Bitte versuch es erneut.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#6366f1",
            color: "#ffffff",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Erneut versuchen
        </button>
      </body>
    </html>
  );
}
