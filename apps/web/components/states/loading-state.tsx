type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return <p aria-live="polite">{label}...</p>;
}
