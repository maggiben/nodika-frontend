## Context

Adelanto already sets `tags: ['adelanto']` on preset apply. Attendance must do the same with `attendance` so Core ingest can identify replies.

## Goals / Non-Goals

**Goals:** Tag attendance preset; brief UI note on the planilla.

**Non-Goals:** Parsing in the frontend; changing catalog send flow.

## Decisions

1. Export `ATTENDANCE_CATALOG_TAG = 'attendance'` next to adelanto.
2. Keep justified as manual-only in the sheet for now.
