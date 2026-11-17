# Flow: Answer a request

From the email a person sends to the shop to the answer. One flow per job a role comes to do, drawn before any screen: each step says who acts, what happens, which screen and state it lands on, and the dialog it opens, if any. A screen state or dialog that no step reaches is a gap, in the flow or in the screen.

- Trigger: a person writes to the shop asking for a copy of their personal data
- Roles: R-02, R-01
- Goals: G-01, G-04
- Ends: the privacy lead has recorded the date the answer was sent

## Steps

| Step | Who | What happens | Screen | States | Dialog | Next |
|---|---|---|---|---|---|---|
| F-01 | R-02 | The support agent reads the email and sends it to the privacy lead | request | ST-07 | - | F-02 |
| F-02 | R-01 | The privacy lead opens the request and sees its due date | request | ST-01, ST-02, ST-03 | - | F-03, or F-08 when the due date passes |
| F-03 | R-01 | Is it clear who the person is? | - | - | - | yes: F-05; no: F-04 |
| F-04 | R-01 | Writes the doubt, asks for proof of identity, and waits | request | ST-05, ST-08 | DL-02 | F-05 when the proof arrives, F-06 to extend while waiting, or F-08 when the due date passes |
| F-05 | R-01 | Can the answer go out by the due date? | - | - | - | yes: F-07; no: F-06 |
| F-06 | R-01 | Extends the due date by two months, with a reason for the person | request | ST-04 | DL-01 | F-07, or F-08 when the new due date passes |
| F-07 | R-01 | Sends the answer from the shop's email, and records the date it was sent | request | ST-06, ST-10 | DL-03 | end |
| F-08 | R-01 | The due date passes with no answer | request | ST-03, ST-09 | - | F-07 |

## Evals

What the flow must do that no screen shows. Each row is one eval: the facts, and what must be true after. The handoff lists them as acceptance tests for whoever builds the backend, beside the screen's evals.

| Eval | Given | Then | Rules |
|---|---|---|---|
| E-15 | The privacy lead marks a request as answered, with the date the answer was sent | The product sends no email or message to the person, and records the date the lead entered | BR-04 |
| E-31 | The privacy lead enters an answer date after today, or before the request reached the shop | The request is not marked as answered, and the field says which date is allowed | BR-04 |
| E-32 | The privacy lead extends a request with a reason | The product sends nothing to the person, and records the reason and the day of the extension | BR-02 |
| E-33 | The privacy lead asks for proof of identity with a doubt written | The product sends nothing to the person, and records the doubt and the day it was asked | BR-05 |
| E-34 | The support agent sends a request on some days after it reached the shop | The due date counts from the day it reached the shop, and the day it was sent is recorded apart | BR-01, BR-08 |

## Decisions

The decisions only this feature needs. They apply to this flow and the screens its steps land on.

| ID | Decision | Why | Decided by | Date |
|---|---|---|---|---|
| D-04 | A request is extended once, always by the full two months. | One letter, one new date. The law allows up to two more months (PRIV-02). | Product designer, with the privacy lead | 2026-11-13 |
| D-05 | While the lead waits for proof of identity, the due date does not move. | Nobody has answered Q-01 yet. Keeping the earlier date is the safe reading. | Product designer | 2026-11-13 |
| D-06 | A request is "due soon" from 7 days before its due date. | The lead needs a week to gather the data and write the answer (G-02). | Product designer | 2026-11-13 |
| D-07 | While the lead waits for proof of identity, the request can still be extended, and it shows as due soon in its last 7 days. | Proof can arrive late. Without this, the lead loses the extension in the last week. | Product designer | 2026-11-17 |
| D-08 | An answer sent after the due date shows as answered late, with the number of days. | A complaint file must show it, and an answer on time must not look the same (G-03). | Product designer | 2026-11-17 |
| D-09 | Each dialog that needs a written reason, doubt or date keeps its main button disabled until it is written. | The person must be told the reasons for an extension (PRIV-03), a doubt about identity must be reasonable (PRIV-07), and an answer needs its date to show later what was done (G-03). | Product designer | 2026-11-17 |

## Not covered

What this feature leaves out on purpose. Each is a gap someone decided to leave, not one nobody saw.

- Refusing a request, or closing it without an answer (PRIV-05). Q-06 asks a lawyer what that needs.
- A request before the support agent sends it on. It sits in the support inbox, outside the product, while its due date already runs.
- Requests to correct, delete or move data. This flow is a request for a copy.
- The list of requests, and reminders. D-02 says what the list does; no flow describes it yet.
