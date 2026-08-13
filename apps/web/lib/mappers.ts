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
