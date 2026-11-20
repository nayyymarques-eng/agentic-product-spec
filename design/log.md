# Design log

Optional. Whoever changes a screen in the design file writes one row here as they make the change: what it was, what it is now, and why. So does whoever decides a change in a conversation, a meeting or a chat while the product is still being shaped, even before anyone draws it: Frame is then the screen it touches, or `product`. It takes a minute, and it keeps the why, which nobody can read back from a drawing later.

It holds product and behaviour changes: what a screen says, shows, offers and does. A change to the look (colour, type, spacing, a component's style) belongs to the design system, which has its own contracts and checks, and does not go here.

Frame is the frame's title. Spec is the decision that brought the change into the spec, or `not yet`. The owner of the round fills in Spec when they write the decision, the state and its eval (`.claude/agents/design-sync.md`). `npm run design` lists every row still `not yet`, and fails on a row with no from, to or why, or on a decision the spec does not have. A row stays when its decision is replaced later: it is history, and the check says what replaced it.

| Date | Frame | From | To | Why | Spec |
|---|---|---|---|---|---|
| 2026-11-13 | request · ST-02 Due soon | "Due soon" showed from 3 days before the due date. | "Due soon" shows from 7 days before. | In the interviews, the lead said a week is what it takes to gather the data and write the answer. | D-06 |
| 2026-10-08 | request · ST-01, DL-01 Extend | The Extend button was always enabled. | The Extend button stays disabled until the reason is written. | The person must be told why the due date moved, and an empty reason gets sent. | D-03 |
| 2026-11-17 | request · ST-01, DL-02 Ask for proof of identity | Only Extend waited for something written. | Every dialog that needs a reason, a doubt or a date keeps its main button disabled until it is written. | The same need came back in two more dialogs, and one decision per button left the others to the builder. | D-09 |
| 2026-11-17 | request · ST-06 Answered | An answer sent late looked the same as one sent on time. | "Answered 4 days late" under the date. | A complaint file must show it. | D-08 |
