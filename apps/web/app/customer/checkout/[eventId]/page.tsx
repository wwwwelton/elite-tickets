import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Ticket } from "@/components/ui";

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
      <Ticket
        emphasized
        header={
          <>
            <p className="label-caps">Checkout</p>
            <h1 className="display-lg">Confirmar reserva</h1>
          </>
        }
        details={<CheckoutFlow eventId={eventId} quantity={quantity} />}
      />
    </main>
  );
}
