## Every Screen Has Four States

Design **loading**, **error**, **empty**, and **content** for screens that load data. These can overlap: a refresh error should coexist with cached content.

- **Loading ≠ empty.** Empty means *resolved with zero items*, not missing data. Handle initial loading, failure, and hydration before checking list length. In TanStack Query v5, `isLoading` means the first fetch is running; a disabled or offline-paused query can have no data without being loading. Show the prerequisite or offline state in that case.
- **Empty is a designed state, not a blank list.** Use `ListEmptyComponent` on FlatList/FlashList: explain why it is empty and offer the relevant next action. "No items yet" can offer Create; "No results" should offer changing or clearing the search/filter.
- **Refetches keep stale content.** Render cached `data` even if a refresh fails, with a nonblocking error and retry. Use `isLoading` for first-fetch spinners and `isFetching` for background activity; prefer a skeleton for a slow initial load with a known layout, and `RefreshControl` for user-initiated refresh.
- **Gate on hydration.** When initial UI or a redirect depends on persisted state (auth token, onboarding flag), the root layout renders nothing - or the splash - until that state has loaded. Deciding on unhydrated state flashes the wrong screen on every cold start and misroutes deep links that arrive before hydration.

**Saves preserve work.** While a mutation is pending, disable repeat submission. On failure, retain the draft, show an inline error, and let the user retry; clear or dismiss only after success. If updating optimistically, restore the previous value or mark the edit as unsynced on failure. Verify with a failed save followed by retry.

