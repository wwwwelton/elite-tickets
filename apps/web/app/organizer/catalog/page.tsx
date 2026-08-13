import { SiteShell } from "@/components/shell/site-shell";

const catalogResults = [
  {
    id: "mv-84920",
    title: "Dune: Part Two",
    meta: "ID: MV-84920 | 166 MIN",
    category: "Sci-Fi",
    selected: true,
  },
  {
    id: "mv-11420",
    title: "Midnight Syndicate",
    meta: "ID: MV-11420 | 104 MIN",
    category: "Concert Film",
  },
  {
    id: "mv-66210",
    title: "Neon Horizon",
    meta: "ID: MV-66210 | 118 MIN",
    category: "Drama",
  },
];

export default function OrganizerCatalogPage() {
  return (
    <SiteShell
      title="Catalog Search"
      subtitle="Search external catalog titles and select one to continue creating an event."
    >
      <div
        style={{
          display: "grid",
          gap: "24px",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.9fr)",
        }}
      >
        <section
          aria-label="Catalog search"
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid rgba(78, 70, 51, 0.8)",
              paddingBottom: "18px",
            }}
          >
            <div
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Step 1
            </div>
            <h2 style={{ margin: "8px 0 0", fontSize: "34px" }}>
              Search catalog
            </h2>
          </div>
          <label style={{ display: "grid", gap: "10px" }}>
            <span
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Movie or external ID
            </span>
            <input
              defaultValue="Dune"
              aria-label="Catalog search term"
              style={{
                background: "transparent",
                border: "1px solid rgba(78, 70, 51, 0.8)",
                borderRadius: "0",
                color: "var(--text)",
                minHeight: "48px",
                padding: "0 14px",
              }}
            />
          </label>

          <div style={{ display: "grid", gap: "14px" }}>
            {catalogResults.map((result) => (
              <article
                key={result.id}
                aria-label={result.title}
                style={{
                  alignItems: "center",
                  background: result.selected
                    ? "rgba(255, 235, 192, 0.08)"
                    : "var(--surface-container)",
                  border: result.selected
                    ? "1px solid var(--accent-strong)"
                    : "1px solid rgba(78, 70, 51, 0.8)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  minHeight: "96px",
                  padding: "18px",
                }}
              >
                <div style={{ display: "grid", gap: "6px" }}>
                  <h3 style={{ margin: 0, fontSize: "24px" }}>{result.title}</h3>
                  <p style={{ color: "var(--muted)", margin: 0 }}>{result.meta}</p>
                  <span
                    style={{
                      color: "var(--accent-strong)",
                      fontSize: "12px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    {result.category}
                  </span>
                </div>
                {result.selected ? (
                  <div
                    aria-hidden="true"
                    style={{
                      color: "var(--accent-strong)",
                      fontSize: "12px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    Selected
                  </div>
                ) : (
                  <a href="/organizer/events/new">Use title</a>
                )}
              </article>
            ))}
          </div>
        </section>

        <aside
          aria-label="Selected catalog item"
          style={{
            background: "var(--surface-container)",
            border: "1px solid rgba(78, 70, 51, 0.8)",
            display: "grid",
            gap: "18px",
            padding: "20px",
            alignSelf: "start",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Step 2
            </div>
            <h2 style={{ margin: "8px 0 0", fontSize: "28px" }}>
              Review imported movie info
            </h2>
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            <div>
              <div style={{ color: "var(--muted)", fontSize: "12px" }}>Title</div>
              <div style={{ marginTop: "6px" }}>Dune: Part Two</div>
            </div>
            <div>
              <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                External ID
              </div>
              <div style={{ marginTop: "6px" }}>MV-84920</div>
            </div>
            <div>
              <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                Catalog source
              </div>
              <div style={{ marginTop: "6px" }}>Ticketmaster</div>
            </div>
          </div>
          <a
            href="/organizer/events/new"
            style={{
              alignItems: "center",
              background: "var(--accent)",
              color: "#121414",
              display: "inline-flex",
              fontWeight: 700,
              justifyContent: "center",
              minHeight: "48px",
              padding: "12px 16px",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Continue
          </a>
        </aside>
      </div>
    </SiteShell>
  );
}
