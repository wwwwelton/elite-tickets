type UnauthorizedStateProps = {
  title?: string;
  description?: string;
};

export function UnauthorizedState({
  title = "Access denied",
  description = "You do not have permission to open this area.",
}: UnauthorizedStateProps) {
  return (
    <section role="alert">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
