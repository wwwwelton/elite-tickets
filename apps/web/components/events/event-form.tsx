"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { EventPoster } from "@/components/events/poster";
import { Ticket, Status, LedgerRow } from "@/components/ui";
import { ApiError, apiMutation, apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type CatalogEvent = {
  external_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  date: string | null;
  venue_name: string | null;
  city: string | null;
  country_code: string | null;
};

type CatalogPage = {
  items: CatalogEvent[];
  page: number;
  size: number;
  total: number;
  has_more: boolean;
};

type CatalogErrorCode = "catalog_auth_error" | "catalog_rate_limited" | "dependency_unavailable";

type CreateEventPayload = {
  external_id: string;
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
  const [catalog, setCatalog] = useState<CatalogPage | null>(null);
  const [selected, setSelected] = useState<CatalogEvent | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchErrorCode, setSearchErrorCode] = useState<CatalogErrorCode | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    const guard = guardRoute(["ORGANIZER"]);
    if (!guard.allowed) {
      router.replace(guard.redirectTo);
      return;
    }
    setAccessToken(guard.session.accessToken);
  }, [router]);

  const emptyState = useMemo(
    () => catalog !== null && catalog.items.length === 0,
    [catalog],
  );

  async function search() {
    if (!accessToken || !query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchErrorCode(null);
    setCatalog(null);
    setSelected(null);
    try {
      setCatalog(
        await apiRequest<CatalogPage>(
          `/catalog/events?keyword=${encodeURIComponent(query.trim())}&countryCode=BR`,
          { accessToken, cache: "no-store" },
        ),
      );
    } catch (caught) {
      setCatalog(null);
      if (caught instanceof ApiError) {
        setSearchError(apiMessage(caught, "O catálogo está indisponível."));
        setSearchErrorCode(
          caught.code === "catalog_auth_error" ||
            caught.code === "catalog_rate_limited" ||
            caught.code === "dependency_unavailable"
            ? caught.code
            : "dependency_unavailable",
        );
      } else {
        setSearchError(apiMessage(caught, "O catálogo está indisponível."));
        setSearchErrorCode("dependency_unavailable");
      }
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
          external_id: selected.external_id,
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

  async function selectEvent(item: CatalogEvent) {
    if (!accessToken || selectingId) return;
    setSelectingId(item.external_id);
    setFormError(null);
    try {
      const detail = await apiRequest<CatalogEvent>(
        `/catalog/events/${encodeURIComponent(item.external_id)}`,
        { accessToken, cache: "no-store" },
      );
      setSelected(detail);
    } catch (caught) {
      setFormError(apiMessage(caught, "Não foi possível carregar os detalhes da origem."));
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <section className="organizer-selector" aria-busy={searching || submitting}>
      <div className="field">
        <label htmlFor="event-query">Pesquisar evento Ticketmaster</label>
        <input
          id="event-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={200}
        />
        <button type="button" disabled={!accessToken || searching || !query.trim()} onClick={() => void search()}>
          {searching ? "Pesquisando…" : "Pesquisar no catálogo"}
        </button>
      </div>

      {searchError ? (
        <Ticket
          header={
            <>
              <Status status={statusForError(searchErrorCode)} />
              <h2 className="headline-sm">Catálogo indisponível</h2>
            </>
          }
          details={
            <>
              <p role="alert">{searchError}</p>
              <button type="button" className="button button--ghost" onClick={() => void search()}>
                Tentar novamente
              </button>
            </>
          }
        />
      ) : null}

      {searching ? <p role="status">Carregando resultados…</p> : null}
      {emptyState ? <p role="status">Nenhum evento encontrado.</p> : null}

      <div className="page-grid organizer-selector__results" style={{ width: "100%" }}>
        {catalog?.items.map((item) => (
          <Ticket
            key={item.external_id}
            emphasized={selected?.external_id === item.external_id}
            header={
              <>
                <EventPoster src={item.image_url} alt={`Pôster de ${item.title}`} />
                <p className="label-caps">{item.category ?? "Ticketmaster"}</p>
                <h2 className="headline-sm">{item.title}</h2>
              </>
            }
            details={
              <ul className="ledger">
                <LedgerRow label="Data" value={item.date ?? "Não informada"} />
                <LedgerRow label="Local" value={item.venue_name ?? "Não informado"} />
                <LedgerRow label="Cidade" value={item.city ?? "Não informada"} />
                <LedgerRow label="País" value={item.country_code ?? "—"} />
              </ul>
            }
            footer={
              <button
                type="button"
                className="button button--ghost"
                onClick={() => void selectEvent(item)}
                disabled={selectingId !== null}
              >
                {selectingId === item.external_id
                  ? "Carregando detalhes…"
                  : selected?.external_id === item.external_id
                    ? "Selecionado"
                    : "Selecionar evento"}
              </button>
            }
          />
        ))}
      </div>

      {selected ? (
        <Ticket
          header={
            <>
              <p className="label-caps">Origem selecionada</p>
              <h2 className="headline-md">{selected.title}</h2>
            </>
          }
          details={
            <form onSubmit={submit} aria-describedby={formError ? "event-form-error" : undefined} className="organizer-selector__form">
              <div className="field"><label htmlFor="venue-name">Local</label><input id="venue-name" name="venue_name" required maxLength={180} defaultValue={selected.venue_name ?? ""} /></div>
              <div className="field"><label htmlFor="venue-address">Endereço</label><input id="venue-address" name="venue_address" required maxLength={300} defaultValue="" /></div>
              <div className="field"><label htmlFor="starts-at">Início</label><input id="starts-at" name="starts_at" type="datetime-local" required /></div>
              <div className="field"><label htmlFor="ends-at">Término</label><input id="ends-at" name="ends_at" type="datetime-local" required /></div>
              <div className="field"><label htmlFor="timezone">Fuso horário</label><input id="timezone" name="timezone" defaultValue="America/Sao_Paulo" required maxLength={64} /></div>
              <div className="field"><label htmlFor="capacity">Capacidade</label><input id="capacity" name="capacity" type="number" min={1} step={1} required /></div>
              <div className="field"><label htmlFor="price">Preço (BRL)</label><input id="price" name="price" type="number" min="0" step="0.01" required /></div>
              {formError ? <p id="event-form-error" role="alert">{formError}</p> : null}
              <button type="submit" disabled={submitting}>{submitting ? "Criando…" : "Criar rascunho"}</button>
            </form>
          }
        />
      ) : null}
    </section>
  );
}

function localDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("invalid local date time");
  return date.toISOString();
}

function statusForError(code: CatalogErrorCode | null) {
  if (code === "catalog_auth_error") return "INVALID";
  if (code === "catalog_rate_limited") return "SOLD_OUT";
  return "WRONG_EVENT";
}

function apiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}
