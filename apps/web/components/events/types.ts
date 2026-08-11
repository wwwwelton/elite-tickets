export type PublicEvent = {
  id: string;
  state: "PUBLISHED";
  title: string;
  poster_url: string | null;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  capacity: number;
  sold_quantity: number;
  available_quantity: number;
  price: string;
};

export type PublicEventPage = {
  items: PublicEvent[];
  page: number;
  total: number;
};
