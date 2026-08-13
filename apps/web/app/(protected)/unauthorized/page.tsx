import { UnauthorizedState } from "@/components/states/unauthorized-state";

export default function UnauthorizedPage() {
  return (
    <UnauthorizedState
      title="Access denied"
      description="This area is available only to the correct authenticated role."
    />
  );
}
