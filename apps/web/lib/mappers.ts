export type EventSummary = {
  id: string;
  title: string;
  startsAt?: string;
  venueName?: string;
  price?: string;
  posterUrl?: string;
};

export type TicketSummary = {
  id: string;
  eventId: string;
  status: string;
  qrCredential?: string;
};

export type ShareSummary = {
  shareUrl: string;
};

export type ValidationSummary = {
  result: string;
  attemptedAt: string;
};

export function mapEventSummary(input: {
  id: string;
  title: string;
  starts_at?: string;
  venue_name?: string;
  price?: string;
  poster_url?: string;
}): EventSummary {
  return {
    id: input.id,
    title: input.title,
    startsAt: input.starts_at,
    venueName: input.venue_name,
    price: input.price,
    posterUrl: input.poster_url,
  };
}

export function mapTicketSummary(input: {
  id: string;
  event_id: string;
  status: string;
  qr_credential?: string;
}): TicketSummary {
  return {
    id: input.id,
    eventId: input.event_id,
    status: input.status,
    qrCredential: input.qr_credential,
  };
}

export function mapShareSummary(input: { share_url: string }): ShareSummary {
  return {
    shareUrl: input.share_url,
  };
}

export function mapValidationSummary(input: {
  result: string;
  attempted_at: string;
}): ValidationSummary {
  return {
    result: input.result,
    attemptedAt: input.attempted_at,
  };
}
