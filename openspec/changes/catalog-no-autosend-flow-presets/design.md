## Context

Catalog create/assign currently call `sendCatalogMessage`. Flow editor already supports nodes + edges but lacks one-click preset seeding.

## Decisions

1. **No auto-send on create/assign** — only `POST .../send` and the schedule job send catalog WhatsApp.
2. **Chaining = flows** — sequence 1→2→3 with reply conditions on edges; do not invent a second catalog sequencing model.
3. **Seed flow nodes from presets** — reuse `applyCatalogMessagePreset` / builders to create a node (title/body); operator connects arrows and starts the flow.

## Risks

- Operators who relied on assign=s send need to click Enviar once — UI copy updates accordingly.
