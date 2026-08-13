import { SiteShell } from "@/components/shell/site-shell";

export const registrationDependencyNotice =
  "Customer registration will reflect the verified backend contract.";

export default function RegisterPage() {
  return (
    <SiteShell
      title="Create account"
      subtitle={registrationDependencyNotice}
    >
      <section aria-label="registration dependency state">
        <p>{registrationDependencyNotice}</p>
      </section>
    </SiteShell>
  );
}
