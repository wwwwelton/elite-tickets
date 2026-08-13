type UnauthorizedStateProps = {
  title?: string;
  description?: string;
};

export function UnauthorizedState({
  title = "Access denied",
  description = "You do not have permission to open this area.",
}: UnauthorizedStateProps) {
  return (
    <section aria-labelledby={`${title}-title`} role="alert">
      <h2 id={`${title}-title`}>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
