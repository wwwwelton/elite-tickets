"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EventSearch({
  initialValue = "",
  autoFocus = false,
}: {
  initialValue?: string;
  autoFocus?: boolean;
}) {
  const [term, setTerm] = useState(initialValue);
  const router = useRouter();

  return (
    <form
      className="d-flex gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = term.trim();
        router.push(trimmed ? `/search?query=${encodeURIComponent(trimmed)}` : "/search");
      }}
    >
      <label className="visually-hidden" htmlFor="event-search">
        Search events
      </label>
      <input
        id="event-search"
        className="form-control"
        type="search"
        name="query"
        autoFocus={autoFocus}
        placeholder="Search events, movies, venues…"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <button className="btn btn-primary" type="submit">
        Search
      </button>
    </form>
  );
}
