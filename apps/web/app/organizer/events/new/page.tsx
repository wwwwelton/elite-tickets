"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StudioShell } from "@/components/shell/studio-shell";
import { RequireRole } from "@/components/shell/require-role";
import { LoadingState } from "@/components/states/states";
import {
  ApiError,
  createOrganizerEvent,
  fetchCatalogEventDetail,
  fetchCatalogEvents,
  publishOrganizerEvent,
  type CatalogEventApi,
} from "@/lib/api";
import { formatMoney } from "@/lib/format";

export default function NewOrganizerEventPage() {
  return (
    <StudioShell eyebrow="Nova configuração" title="Criar evento">
      <RequireRole role="ORGANIZER">
        <Suspense fallback={<LoadingState />}>
          <CreateEventWizard />
        </Suspense>
      </RequireRole>
    </StudioShell>
  );
}

const defaultTimezone =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

function CreateEventWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<CatalogEventApi[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogEventApi | null>(null);

  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:30");
  const [endTime, setEndTime] = useState("22:00");
  const [capacity, setCapacity] = useState("300");
  const [price, setPrice] = useState("45.00");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const presetExternalId = searchParams.get("external_id");

  useEffect(() => {
    if (!presetExternalId) {
      return;
    }
    fetchCatalogEventDetail(presetExternalId)
      .then((item) => {
        setSelected(item);
        setVenueName((current) => current || item.venue_name || "");
        setDate((current) => current || item.date || "");
      })
      .catch(() => undefined);
  }, [presetExternalId]);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!keyword.trim()) {
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const page = await fetchCatalogEvents({ keyword: keyword.trim() });
      setResults(page.items);
      if (page.items.length === 0) {
        setSearchError("Nenhum título do catálogo correspondeu a essa palavra-chave.");
      }
    } catch (caught) {
      setSearchError(
        caught instanceof ApiError
          ? caught.message
          : "A busca no catálogo está indisponível no momento.",
      );
    } finally {
      setSearching(false);
    }
  }

  function selectItem(item: CatalogEventApi) {
    setSelected(item);
    setVenueName((current) => current || item.venue_name || "");
    setDate((current) => current || item.date || "");
  }

  async function handleCreate(publishAfterCreate: boolean) {
    if (!selected || !date) {
      setSubmitError("Selecione um título do catálogo e uma data de exibição primeiro.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createOrganizerEvent({
        external_id: selected.external_id,
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim(),
        starts_at: new Date(`${date}T${startTime}`).toISOString(),
        ends_at: new Date(`${date}T${endTime}`).toISOString(),
        timezone: defaultTimezone,
        capacity: Number(capacity),
        price,
      });

      if (publishAfterCreate) {
        await publishOrganizerEvent(created.id);
      }

      router.push("/organizer/events");
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError
          ? caught.message
          : "O evento não pôde ser criado.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="row g-4">
      <div className="col-12 col-xl-8 d-grid gap-4">
        <section className="card p-3 p-lg-4 d-grid gap-3" aria-label="Selecionar um título">
          <div>
            <p className="eyebrow mb-1">1. Selecionar título</p>
            <h2 className="h4 text-cream mb-0">Buscar no catálogo externo</h2>
          </div>

          <form className="d-flex gap-2" onSubmit={handleSearch}>
            <label className="visually-hidden" htmlFor="catalog-keyword">
              Palavra-chave do catálogo
            </label>
            <input
              id="catalog-keyword"
              className="form-control"
              placeholder="Nome do filme, show ou evento"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={searching}>
              {searching ? "Buscando…" : "Buscar"}
            </button>
          </form>

          {searchError ? (
            <div className="alert alert-warning mb-0" role="alert">
              {searchError}
            </div>
          ) : null}

          <ul className="list-unstyled d-grid gap-2 mb-0">
            {results.map((item) => {
              const active = selected?.external_id === item.external_id;
              return (
                <li key={item.external_id}>
                  <button
                    className={`card w-100 text-start p-3 flex-row gap-3 align-items-center ${
                      active ? "border-warning" : ""
                    }`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectItem(item)}
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt=""
                        style={{ width: "4rem", height: "5rem", objectFit: "cover" }}
                      />
                    ) : null}
                    <span className="d-grid gap-1">
                      <span className="h5 text-cream mb-0">{item.title}</span>
                      <span className="font-mono small text-secondary">
                        {item.external_id}
                        {item.category ? ` · ${item.category}` : ""}
                      </span>
                      <span className="font-mono small text-secondary">
                        {[item.venue_name, item.city].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-3 p-lg-4 d-grid gap-3" aria-label="Logística">
          <div>
            <p className="eyebrow mb-1">2. Logística</p>
            <h2 className="h4 text-cream mb-0">Agenda, local e preço</h2>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="event-date">
                Data do show
              </label>
              <input
                id="event-date"
                className="form-control"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label" htmlFor="event-start">
                Início
              </label>
              <input
                id="event-start"
                className="form-control"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label" htmlFor="event-end">
                Fim
              </label>
              <input
                id="event-end"
                className="form-control"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="event-venue">
                Nome do local
              </label>
              <input
                id="event-venue"
                className="form-control"
                value={venueName}
                onChange={(event) => setVenueName(event.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="event-address">
                Endereço do local
              </label>
              <input
                id="event-address"
                className="form-control"
                value={venueAddress}
                onChange={(event) => setVenueAddress(event.target.value)}
              />
            </div>
            <div className="col-6">
              <label className="form-label" htmlFor="event-capacity">
                Capacity
              </label>
              <input
                id="event-capacity"
                className="form-control"
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
              />
            </div>
            <div className="col-6">
              <label className="form-label" htmlFor="event-price">
                Price
              </label>
              <input
                id="event-price"
                className="form-control"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
          </div>

          <p className="text-secondary small mb-0">
            Timezone: <span className="font-mono">{defaultTimezone}</span>
          </p>
        </section>
      </div>

      <div className="col-12 col-xl-4">
        <aside className="card p-3 d-grid gap-3" aria-label="Live preview">
          <p className="eyebrow mb-0">Prévia ao vivo</p>

          <div className="stub">
            <div className="p-3 d-grid gap-1">
              <span className="badge text-cream">Draft</span>
              <h3 className="h4 text-cream mb-0">
                {selected?.title ?? "Selecione um título"}
              </h3>
              <p className="font-mono small text-secondary mb-0">
                {venueName || "Local"}
              </p>
            </div>
            <div className="perf d-flex align-items-center px-3">
              <span className="perf__line flex-grow-1" aria-hidden="true" />
            </div>
            <div className="p-3 d-flex justify-content-between">
              <span>
                <span className="eyebrow d-block">Data</span>
                <span className="font-mono">{date || "—"}</span>
              </span>
              <span>
                <span className="eyebrow d-block">Hora</span>
                <span className="font-mono">{startTime}</span>
              </span>
              <span className="text-end">
                <span className="eyebrow d-block">Preço</span>
                <span className="font-mono">{formatMoney(price)}</span>
              </span>
            </div>
          </div>

          {submitError ? (
            <div className="alert alert-danger mb-0" role="alert">
              {submitError}
            </div>
          ) : null}

          <button
            className="btn btn-primary"
            type="button"
            disabled={submitting || !selected}
            onClick={() => handleCreate(true)}
          >
            {submitting ? "Processando…" : "Criar e publicar"}
          </button>
          <button
            className="btn btn-outline-light"
            type="button"
            disabled={submitting || !selected}
            onClick={() => handleCreate(false)}
          >
            Salvar como rascunho
          </button>
        </aside>
      </div>
    </div>
  );
}
