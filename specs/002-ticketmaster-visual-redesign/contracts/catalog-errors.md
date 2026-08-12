# Catalog Error Contract

## Error mapping

### Timeout

- Backend response: `503`
- Error code: `dependency_unavailable`
- User-facing state: `error`
- Guidance: allow retry after a short pause

### Unauthorized upstream credentials

- Backend response: `502` or `503`, depending on backend policy
- Error code: `catalog_auth_error`
- User-facing state: `auth_error`
- Guidance: prompt configuration review without exposing secrets

### Rate limit

- Backend response: `429`
- Error code: `catalog_rate_limited`
- User-facing state: `rate_limited`
- Guidance: inform the organizer to retry later

### Upstream 5xx

- Backend response: `502` or `503`
- Error code: `dependency_unavailable`
- User-facing state: `upstream_error`
- Guidance: retry later

### Empty results

- Backend response: `200`
- Error code: none
- User-facing state: `empty`
- Guidance: adjust the keyword or filters

### Missing optional fields

- Backend response: `200`
- Error code: none
- User-facing state: normal result presentation with fallbacks
- Guidance: show placeholders instead of inventing content

## Logging rules

- Never log `apikey`.
- Never echo upstream auth headers.
- Include request context sufficient to trace search and detail failures without exposing secrets.
