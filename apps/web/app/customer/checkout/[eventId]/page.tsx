import { CheckoutFlow } from "@/components/checkout/checkout-flow";

type CheckoutPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ quantity?: string | string[] }>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const [{ eventId }, query] = await Promise.all([params, searchParams]);
  const requestedQuantity =
    typeof query.quantity === "string" ? Number(query.quantity) : Number.NaN;
  const quantity =
    Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1;

  return (
    <main className="page-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <p className="label-caps">Checkout</p>
        <h1 className="display-lg">Confirmar reserva</h1>
        <CheckoutFlow eventId={eventId} quantity={quantity} />
      </div>
    </main>
  );
}
