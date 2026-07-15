# Design: User settings page

## UX

- Route: `/[locale]/settings` (auth required; redirect to login if unauthenticated)
- Sections: Appearance (theme), Language, Password, Email notifications
- Email schedule: enable toggle, frequency (weekly/monthly), day pickers (weekday toggles or month day select), time input, preview of next 3 send dates
- Navbar: remove standalone language select and theme items from avatar menu; add Settings link; avatar shows two-letter initials from email

## BFF

- `GET /api/settings` → Core `GET /account/settings` with session Bearer token
- `PATCH /api/settings` → Core `PATCH /account/settings`
- `POST /api/settings/change-password` → Core `POST /account/change-password`

## Core contract

```json
{
  "email": "user@example.com",
  "emailSchedule": {
    "enabled": true,
    "frequency": "weekly",
    "daysOfWeek": [1, 3, 5],
    "dayOfMonth": 15,
    "sendTime": "09:00",
    "timezone": "America/Argentina/Buenos_Aires"
  },
  "nextSendDates": ["2026-07-16T12:00:00.000Z"]
}
```

`nextSendDates` is computed server-side from the saved schedule for dynamic preview.
