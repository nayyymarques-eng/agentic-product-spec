# Decisions

The product decisions: choices the team made on purpose, so nobody flags them as errors and nobody has to ask again. A decision can come from user research, a market insight, the business strategy or a technical limit. None may go against an external rule in `sources/`.

Decisions live at two levels. This log holds the ones the whole product shares: "Applies to" says `product`, or names the flows and screens it touches. A decision only one feature needs lives in that flow's file, under `## Decisions`, and applies to that flow and the screens its steps land on. When a decision is no longer true, it moves to `decisions-replaced.md`, with the ID of the one that replaces it.

| ID | Decision | Why | Decided by | Applies to | Date |
|---|---|---|---|---|---|
| D-01 | The product does not send answers to the person. The privacy lead sends them from the shop's own email and marks the request as answered, with the date sent. | The person wrote to that address, and the shop keeps one channel. Known effect: the product records the date the lead enters, not proof of delivery. | Product designer, with the privacy lead | product | 2026-10-01 |
| D-02 | A request past its due date stays at the top of the list, marked "overdue", until someone closes it. It never leaves the list on its own. | A request nobody closed is still open. | Product designer | product | 2026-10-01 |
