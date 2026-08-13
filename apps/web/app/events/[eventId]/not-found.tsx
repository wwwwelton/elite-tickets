import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/states/states";

export default function EventNotFound() {
  return (
    <AppShell backHref="/">
      <div className="container py-5">
        <EmptyState
          title="Event unavailable"
          description="This event is not published, was cancelled, or does not exist."
          action={
            <Link className="btn btn-primary" href="/">
              Back to discovery
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
