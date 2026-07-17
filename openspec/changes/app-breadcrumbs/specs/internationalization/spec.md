## ADDED Requirements

### Requirement: Breadcrumb segment labels

The application dictionaries for Spanish and English SHALL include labels for shared breadcrumb navigation (Home and known app route segments). Breadcrumb copy SHALL follow the active locale.

#### Scenario: Localized breadcrumb labels

- **WHEN** the breadcrumb trail renders on an authenticated app route
- **THEN** each known segment label SHALL come from the active locale dictionary
- **AND** Spanish and English dictionaries SHALL both define those keys
