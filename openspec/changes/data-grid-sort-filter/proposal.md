## Why

Task Data Grids on the project dashboard currently disable the column menu and omit toolbar filtering, so users cannot sort or filter tasks. Those interactions are expected for a Material Data Grid of project work.

## What Changes

- Enable column sorting on objective and context task Data Grids
- Enable column filtering (column menu and/or toolbar quick filter)
- Restore the Data Grid toolbar / column menu needed for those interactions

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `project-dashboard`: task Data Grids SHALL support sorting and filtering

## Impact

- `src/components/project-dashboard.tsx` and related tests
- OpenSpec `project-dashboard` requirement wording
