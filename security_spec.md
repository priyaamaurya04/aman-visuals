# Security Specification & Test Matrix

## 1. Data Invariants
- `portfolio_items` documents can be read by any visitor to display the edited showreel and project videos.
- `portfolio_items` can only be created, updated, or deleted by authenticated users (`request.auth != null`).
- `id` in the document body must match the path variable `{itemId}`.
- `updatedBy` must match `request.auth.uid`.
- Timestamps (`updatedAt`) must strictly match `request.time`.
- Input strings (`title`, `videoUrl`, `client`, `role`) must respect maximum length boundaries to prevent Denial-of-Wallet or resource poisoning.
- `videoUrl` must be non-empty and bounded up to 500 characters.
- `itemType` must be either `'showreel'` or `'project'`.

## 2. The Dirty Dozen Payloads (Security Attack Vectors)
1. **Unauthenticated Write**: An unauthenticated user attempts to create a showreel link -> REJECT (Missing auth).
2. **ID Spoofing**: An attacker tries to write doc `/portfolio_items/showreel` with `id: "fake-id"` -> REJECT (ID mismatch).
3. **Identity Spoofing**: An authenticated user tries to set `updatedBy: "victim-uid"` -> REJECT (`updatedBy != request.auth.uid`).
4. **Giant Payload / Buffer Overflow**: An attacker sends `videoUrl` of 50KB length -> REJECT (Exceeds 500 character limit).
5. **Ghost Field / Shadow Property Injection**: An attacker adds `{ "isRootAdmin": true }` to document -> REJECT (Keys whitelist validation).
6. **Invalid Enum**: An attacker sends `itemType: "malicious_script"` -> REJECT (Not in `['showreel', 'project']`).
7. **Client Timestamp Tampering**: An attacker supplies a backdated `updatedAt` instead of `request.time` -> REJECT (`updatedAt != request.time`).
8. **Path Traversal / Toxic ID**: An attacker attempts to write to `/portfolio_items/../../etc/passwd` -> REJECT (`isValidId` regex guard).
9. **Missing Mandatory Field**: An attacker posts without `videoUrl` or `title` -> REJECT (Required fields check).
10. **Type Confusion Attack**: An attacker passes `videoUrl: 1337` (number instead of string) -> REJECT (`is string`).
11. **Negative / Zero Size Attack**: An attacker passes `videoUrl: ""` -> REJECT (`size() > 0`).
12. **Blanket Delete / Unauthorized Mutation**: An unauthenticated script attempts to delete a portfolio item -> REJECT.
