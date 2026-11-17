# Decisions

The product decisions: choices the team made on purpose, so nobody flags them as errors and nobody has to ask again. A decision can come from user research, a market insight, the business strategy or a technical limit. None may go against an external rule in `sources/`.

Decisions live at two levels. This is the product decision log: decisions about the whole product, made for no single feature. "Applies to" says `product`, or names the flows and screens it touches. Every decision made for a feature lives in that feature's decision log, in its flow file under `## Decisions`, even when other features follow it too. When a decision is no longer true, it moves to `decisions-replaced.md`, with the ID of the one that replaces it. A decision someone proposes is `proposed` until the person in Decided by approves it and sets it to `decided`.

| ID | Decision | Why | Decided by | Applies to | Date | Status |
|---|---|---|---|---|---|---|
| D-01 | The product does not send answers to the person. The privacy lead sends them from the shop's own email and marks the request as answered, with the date sent. | The person wrote to that address, and the shop keeps one channel. Known effect: the product records the date the lead enters, not proof of delivery. | Product designer, with the privacy lead | product | 2026-10-01 | decided |
| D-02 | A request past its due date stays at the top of the list, marked "overdue", until someone closes it. It never leaves the list on its own. | A request nobody closed is still open. | Product designer | product | 2026-10-01 | decided |
