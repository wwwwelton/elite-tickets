"use client";

import Link from "next/link";
import { useState } from "react";
import { StudioShell } from "@/components/shell/studio-shell";
import { RequireRole } from "@/components/shell/require-role";
import { EmptyState } from "@/components/states/states";
import { ApiError, fetchCatalogEvents, type CatalogEventApi } from "@/lib/api";

export default function OrganizerCatalogPage() {
  return (
    <StudioShell eyebrow="External catalog" title="Catalog">
      <RequireRole role="ORGANIZER">
        <CatalogSearch />
      </RequireRole>
    </StudioShell>
  );
}

function CatalogSearch() {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<CatalogEventApi[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!keyword.trim()) {
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const page = await fetchCatalogEvents(keyword.trim());
      setItems(page.items);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "The catalog is unavailable right now.",
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="d-grid gap-3">
      <form className="d-flex gap-2" onSubmit={handleSearch} role="search">
        <label className="visually-hidden" htmlFor="catalog-search">
          Search the catalog
        </label>
        <input
          id="catalog-search"
          className="form-control"
          placeholder="Search movies, tours, and shows"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {error ? (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      ) : null}

      {items && items.length === 0 ? (
        <EmptyState
          title="No results"
          description="Try another keyword to find a catalog title."
        />
      ) : null}

      {items && items.length > 0 ? (
        <ul className="list-unstyled row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-0">
          {items.map((item) => (
            <li className="col" key={item.external_id}>
              <article className="card h-100">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="poster poster--wide" src={item.image_url} alt="" />
                ) : (
                  <div className="poster poster--wide" />
                )}
                <div className="card-body d-grid gap-2">
                  <h2 className="h5 text-cream mb-0">{item.title}</h2>
                  <p className="font-mono small text-secondary mb-0">
                    {item.external_id}
                  </p>
                  {item.description ? (
                    <p className="small text-secondary mb-0">
                      {item.description.slice(0, 140)}
                      {item.description.length > 140 ? "…" : ""}
                    </p>
                  ) : null}
                  <Link
                    className="btn btn-outline-light btn-sm"
                    href={`/organizer/events/new?external_id=${encodeURIComponent(item.external_id)}`}
                  >
                    Use this title
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
