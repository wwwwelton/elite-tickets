"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { EventPoster } from "@/components/events/poster";
import { ApiError, apiMutation, apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type MovieResult = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
};

type CreateEventPayload = {
  tmdb_id: number;
  venue_name: string;
  venue_address: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number;
  price: string;
};

export function EventForm() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<MovieResult[]>([]);
  const [selected, setSelected] = useState<MovieResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const guard = guardRoute(["ORGANIZER"]);
    if (!guard.allowed) {
      router.replace(guard.redirectTo);
      return;
    }
    setAccessToken(guard.session.accessToken);
  }, [router]);

  async function search() {
    if (!accessToken || !query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      setMovies(
        await apiRequest<MovieResult[]>(
          `/catalog/movies?query=${encodeURIComponent(query.trim())}`,
          { accessToken, cache: "no-store" },
        ),
      );
    } catch (caught) {
      setSearchError(apiMessage(caught, "O catálogo está indisponível."));
    } finally {
      setSearching(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !selected) return;
    setSubmitting(true);
    setFormError(null);
    const data = new FormData(event.currentTarget);
    try {
      await apiMutation<unknown, CreateEventPayload>("/events", {
        accessToken,
        body: {
          tmdb_id: selected.tmdb_id,
          venue_name: String(data.get("venue_name")),
          venue_address: String(data.get("venue_address")),
          starts_at: localDateTime(String(data.get("starts_at"))),
          ends_at: localDateTime(String(data.get("ends_at"))),
          timezone: String(data.get("timezone")),
          capacity: Number(data.get("capacity")),
          price: String(data.get("price")),
        },
      });
      router.push("/organizer/events");
    } catch (caught) {
      setFormError(apiMessage(caught, "Não foi possível criar o evento."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="field">
        <label htmlFor="movie-query">Pesquisar filme</label>
        <input id="movie-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={200} />
        <button type="button" disabled={!accessToken || searching || !query.trim()} onClick={search}>
          {searching ? "Pesquisando…" : "Pesquisar no TMDb"}
        </button>
      </div>
      {searchError ? (
        <div role="alert">
          <p>{searchError}</p>
          <button type="button" className="button button--ghost" onClick={search}>Tentar novamente</button>
        </div>
      ) : null}
      <div className="page-grid" style={{ width: "100%" }}>
        {movies.map((movie) => (
          <article className="ticket" key={movie.tmdb_id}>
            <div className="ticket__section">
              <EventPoster src={posterUrl(movie.poster_path)} alt={`Pôster de ${movie.title}`} />
              <h2 className="headline-sm">{movie.title}</h2>
              <p className="code-data">{movie.release_date ?? "Data não informada"}</p>
              <button type="button" className="button button--ghost" onClick={() => setSelected(movie)}>
                {selected?.tmdb_id === movie.tmdb_id ? "Selecionado" : "Selecionar filme"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {selected ? (
        <form onSubmit={submit} aria-describedby={formError ? "event-form-error" : undefined}>
          <p className="label-caps">Filme selecionado</p>
          <h2 className="headline-md">{selected.title}</h2>
          <div className="field"><label htmlFor="venue-name">Local</label><input id="venue-name" name="venue_name" required maxLength={180} /></div>
          <div className="field"><label htmlFor="venue-address">Endereço</label><input id="venue-address" name="venue_address" required maxLength={300} /></div>
          <div className="field"><label htmlFor="starts-at">Início</label><input id="starts-at" name="starts_at" type="datetime-local" required /></div>
          <div className="field"><label htmlFor="ends-at">Término</label><input id="ends-at" name="ends_at" type="datetime-local" required /></div>
          <div className="field"><label htmlFor="timezone">Fuso horário</label><input id="timezone" name="timezone" defaultValue="America/Sao_Paulo" required maxLength={64} /></div>
          <div className="field"><label htmlFor="capacity">Capacidade</label><input id="capacity" name="capacity" type="number" min={1} step={1} required /></div>
          <div className="field"><label htmlFor="price">Preço (BRL)</label><input id="price" name="price" type="number" min="0" step="0.01" required /></div>
          {formError ? <p id="event-form-error" role="alert">{formError}</p> : null}
          <button type="submit" disabled={submitting}>{submitting ? "Criando…" : "Criar rascunho"}</button>
        </form>
      ) : null}
    </section>
  );
}

function localDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("invalid local date time");
  return date.toISOString();
}

function posterUrl(path: string | null): string | null {
  return path ? `https://image.tmdb.org/t/p/w500/${path.replace(/^\/+/, "")}` : null;
}

function apiMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
