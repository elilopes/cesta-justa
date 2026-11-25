# Security Specification — Cesta Justa

## 1. Data Invariants
1. A `PriceEntry` cannot be created unless both `productId` and `storeId` already exist in `/products` and `/stores`, and `reportedBy` matches `request.auth.uid`.
2. Private user collections (`/shoppingLists`, `/favorites`, `/savingsLogs`, `/users/{uid}/private`) can only be read, listed, updated, or deleted by the authenticated owner (`userId == request.auth.uid`).
3. Every `create` operation enforces `createdAt == request.time` (and `updatedAt == request.time` where applicable), preventing client-side timestamp spoofing.
4. Every `create` and `update` enforces exact key allowlists (`hasAll` + `hasOnly` on create, `diff().affectedKeys().hasOnly(...)` on update) and explicit string `.size()` limits to prevent shadow fields and payload bloat.
5. Every write requires `request.auth != null && request.auth.token.email_verified == true`.
6. Document IDs on single-document operations must match `^[a-zA-Z0-9_\-]+$` and length `<= 128`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Be Denied)
1. **Unauthenticated Price Submission**: Write to `/priceEntries/entry_1` with `auth == null`.
2. **Unverified Email Write**: Write to `/stores/store_1` with `email_verified: false`.
3. **UID Spoofing on Price Entry**: Authenticated user A submits `/priceEntries/entry_2` with `reportedBy: "user_B"`.
4. **Orphaned Price Entry**: Submit `/priceEntries/entry_3` referencing non-existent `productId: "missing_prod"`.
5. **Shadow Field Injection on Shopping List**: Create `/shoppingLists/list_1` with extra ghost field `isAdmin: true`.
6. **Cross-Tenant List Scraping**: User A calls `list` on `/shoppingLists` without `where('userId', '==', uidA)` or tries to read User B's list.
7. **PII Leak Attempt**: User A tries to `get` `/users/userB/private/info`.
8. **Immutable Field Tampering**: User A updates `/shoppingLists/list_1` attempting to modify `createdAt` or `userId`.
9. **ID Poisoning Attack**: Create `/stores/<200-char-invalid-id!@#>` with disallowed characters or oversized ID.
10. **Array Overflow Attack**: Create `/shoppingLists/list_2` with `items` array containing 55 entries (`> 50`).
11. **Timestamp Forgery**: Create `/savingsLogs/log_1` with backdated client `createdAt`.
12. **Price Range Poisoning**: Submit `/priceEntries/entry_4` with negative price `-10` or string `"10.00"`.
