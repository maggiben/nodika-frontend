## Why

The project dashboard currently uses hand-built SVG rings, LinearProgress bars, and plain Material UI tables. Switching to MUI X Charts and the Community Data Grid improves readability and matches the Material ecosystem already in use.

## What Changes

- Add `@mui/x-charts` and `@mui/x-data-grid` (Community) dependencies
- Render overall progress with a Gauge chart
- Render duration and sector breakdowns with BarChart
- Render objective and context task lists with DataGrid instead of Table

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `project-dashboard`: visualizations and task lists MUST use MUI X Charts and Community Data Grid
- `frontend-tooling`: allow the new MUI X Community packages as approved UI dependencies

## Impact

- `package.json` / lockfile
- `src/components/project-dashboard.tsx` and its tests
- OpenSpec `project-dashboard` and possibly `frontend-tooling` specs
