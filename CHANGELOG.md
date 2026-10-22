# Changelog

## Unreleased — 2026-10-22

### Changed

- Load the group list from `GET /Admin/Group` with the administrator session, pagination, total count, and all-group filtering.
- Send group search terms through the documented `Filter.Keywords` parameter.
- Validate and normalize group-list responses, including an empty list with `items: null`.
- Show group-loading errors and a retry action instead of presenting a failed request as zero groups.
- Show each group's description and stored link in its expanded details, including an explicit empty-link state.
- Simplify the visible footer branding and package name, and remove an unused dependency.

### Verification

- A signed-in administrator loaded six groups from the production API through the local app. None had a stored group link.
- TypeScript, the full test suite (60 tests), and the production build passed.

### Open issue

- The production API returned all six groups for a keyword that should match none. Group search needs further investigation before it can be marked complete in the development plan.
