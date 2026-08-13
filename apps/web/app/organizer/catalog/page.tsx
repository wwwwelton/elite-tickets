"use client";

import Link from "next/link";
import { useState } from "react";
import { StudioShell } from "@/components/shell/studio-shell";
import { RequireRole } from "@/components/shell/require-role";
import { EmptyState } from "@/components/states/states";
import { ApiError, fetchCatalogEvents, type CatalogEventApi } from "@/lib/api";

export default function OrganizerCatalogPage() {
  return (
    <StudioShell eyebrow="Catálogo externo" title="Catálogo">
      <RequireRole role="ORGANIZER">
        <CatalogSearch />
      </RequireRole>
    </StudioShell>
  );
}

function CatalogSearch() {
  const [keyword, setKeyword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState<CatalogEventApi[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    const normalizedCountry = countryCode.trim();
    if (normalizedCountry && normalizedCountry.length !== 2) {
      setError("O país deve ser um código de 2 letras, como BR, US ou PT.");
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const page = await fetchCatalogEvents({
        keyword: keyword.trim() || undefined,
        countryCode: normalizedCountry || undefined,
        city: city.trim() || undefined,
      });
      setItems(page.items);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "O catálogo está indisponível no momento.",
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="d-grid gap-3">
      <form className="row g-2 align-items-end" onSubmit={handleSearch} role="search">
        <div className="col-12 col-md-5">
          <label className="form-label" htmlFor="catalog-search">
            Palavra-chave
          </label>
          <input
            id="catalog-search"
            className="form-control"
            placeholder="Filmes, shows e eventos (opcional)"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <div className="col-6 col-md-2">
          <label className="form-label" htmlFor="catalog-country">
            País
          </label>
          <input
            id="catalog-country"
            className="form-control"
            placeholder="Qualquer"
            maxLength={2}
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label" htmlFor="catalog-city">
            Cidade
          </label>
          <input
            id="catalog-city"
            className="form-control"
            placeholder="Qualquer"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>
        <div className="col-12 col-md-2">
          <button className="btn btn-primary w-100" type="submit" disabled={searching}>
            {searching ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>
      <p className="form-text text-secondary mt-0">
        Deixe a palavra-chave e o país em branco para listar eventos de qualquer lugar do mundo.
      </p>

      {error ? (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      ) : null}

      {items && items.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Tente outra palavra-chave, país ou cidade para encontrar um título no catálogo."
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
                    Usar este título
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
