import { Scanner } from "@/components/tickets/scanner";

export default function GatePage() {
  return (
    <main className="page-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <p className="label-caps">Portaria</p>
        <h1 className="display-lg">Validar ingresso</h1>
        <Scanner />
      </div>
    </main>
  );
}
