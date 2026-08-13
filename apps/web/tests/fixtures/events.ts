import type { PublicEventApi, TicketApi } from "@/lib/api";

export const cinemaEvent: PublicEventApi = {
  id: "event-1",
  title: "Neon Horizon",
  starts_at: "2026-09-10T20:00:00Z",
  venue_name: "Grand Cinema",
  price: "18.00",
  poster_url: "/posters/neon-horizon.jpg",
  overview: "A premiere screening.",
};

export const arenaEvent: PublicEventApi = {
  id: "event-2",
  title: "Midnight Syndicate Live",
  starts_at: "2026-10-31T23:00:00Z",
  venue_name: "Warehouse 21",
  price: "60.00",
};

export const activeTicket: TicketApi = {
  id: "11111111-2222-3333-4444-555555555555",
  event_id: "event-1",
  owner_name: "Jane Customer",
  status: "ACTIVE",
  issued_at: "2026-08-13T15:46:00Z",
  used_at: null,
  qr_credential: "signed.ticket.credential",
};
