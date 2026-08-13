# Research Notes: Complete Ticketing Frontend

## 1. Frontend and backend shape

- **Decision**: Treat the feature as a full-stack web product with the frontend consuming the existing FastAPI backend.
- **Rationale**: The repository already contains the backend route surface and the feature spec requires that the frontend not invent new product APIs.
- **Alternatives considered**: A frontend-only mock flow was rejected because it would violate backend-authoritative business rules and the approved route matrix.

## 2. Authentication and role routing

- **Decision**: Use the backend token login contract and derive the post-login destination from the returned role claim.
- **Rationale**: `POST /api/v1/auth/token` returns `access_token`, `expires_in`, and `role`, which is sufficient to route Customer, Organizer, and Gate users without a `/me` endpoint.
- **Alternatives considered**: Adding a profile lookup step was rejected because no verified endpoint exists and it would add unnecessary coupling.

## 3. Customer registration gap

- **Decision**: Expose "Criar conta" in the UI, but treat registration as an explicit backend dependency until a verified contract is found.
- **Rationale**: The requested product experience requires visible registration entry, yet the verified backend routes do not include registration.
- **Alternatives considered**: Faking successful account creation was rejected because it would misrepresent production behavior.

## 4. Ticket selection mode

- **Decision**: Implement the supported quantity-based reservation flow as the production default and only surface seat or sector allocation if the backend contract explicitly provides it.
- **Rationale**: `POST /api/v1/events/{eventId}/reservations` currently accepts quantity only, and the spec forbids fabricating live seat maps or sector availability.
- **Alternatives considered**: A synthetic seat-map UI was rejected because it would not be backed by a real availability contract.

## 5. Checkout and simulated payment

- **Decision**: Present checkout as a simulated payment step with approved and declined outcomes driven by the existing payment endpoint.
- **Rationale**: The backend already models approved/declined payment decisions and requires an idempotency key, so the UI should reflect that explicitly.
- **Alternatives considered**: A real payment integration was rejected because it is out of scope and unsupported by the backend contract.

## 6. Tickets, sharing, and QR security

- **Decision**: Show tickets, share links, and QR credentials exactly as returned by the backend, without client-side validity logic.
- **Rationale**: The backend already owns credential generation, sharing tokens, and single-use validation; the frontend should only render and route.
- **Alternatives considered**: Client-side QR verification was rejected because it would weaken the security model and violate the constitution.

## 7. Organizer and gate operational flows

- **Decision**: Keep organizer creation, publish/cancel, and gate validation on the verified backend routes already present in the API inventory.
- **Rationale**: These flows are already defined and tested in the backend, so the frontend should present them clearly without adding new server behavior.
- **Alternatives considered**: Consolidating organizer and gate into a single role shell was rejected because the roles differ materially in speed, contrast, and task structure.

## 8. Visual direction

- **Decision**: Use the approved `docs/design/` references as the visual target while keeping the product original and responsive.
- **Rationale**: The spec requires Apple-inspired principles without copying Apple, and the references already define the approved product tone.
- **Alternatives considered**: Replacing the references with a generic admin template was rejected because it would conflict with the approved design direction.

