# Proposal: User settings page

## Why

The avatar dropdown is crowded with theme, language, upload, and logout actions. Users need a dedicated settings area for appearance, locale, password change, and email notification timing without cron-style configuration.

## What

- Add localized `/settings` page for authenticated users
- Move theme and language controls from navbar to settings
- Simplify avatar menu to settings link, upload, and logout
- Show avatar initials from the first two letters of the user email
- Add password change (current + new) via BFF → Core
- Add email notification schedule using weekly/monthly day pickers and a send time, persisted via BFF → Core

## Impact

- `application-shell` navbar behavior
- New `user-settings` capability
- Core account settings endpoints (implemented in nodika-core)
