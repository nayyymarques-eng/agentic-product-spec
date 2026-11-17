# Open questions

What nobody has answered yet. The spec says what the product does in the meantime, and the decision that holds it, so the screen can be built today and changed in one place later.

"Applies to" names the flows and screens the question touches. A question may stay open while it touches one feature: a flow and the screens its steps land on. A question that reaches further can change other features too, so the spec check fails until it is answered, and the answer becomes a decision.

| ID | Question | Who answers | Meanwhile | Applies to |
|---|---|---|---|---|
| Q-01 | Does the month stop while the shop waits for proof of identity (PRIV-07)? | A privacy lawyer | The due date does not move (D-05) | answer-a-request, request |
| Q-02 | How is "one month" counted when the next month has no such day, such as a request received on 31 January? | A privacy lawyer | The due date is the last day of the next month | answer-a-request, request |
| Q-03 | Once extended, is the due date three months after the request reached the shop, or two months after the first due date? They differ at month end: a request received on 31 January is due on 30 April or 28 April. | A privacy lawyer | Three months after the request reached the shop | answer-a-request, request |
| Q-04 | Must the person be told about the extension within the first month, and can a request be extended on its due date? | A privacy lawyer | Extend works up to and including the due date. The product records the reason, not the day the letter went out | answer-a-request, request |
| Q-05 | May a request be answered while proof of identity is still awaited? | A privacy lawyer | Mark as answered stays, as the least prominent action | answer-a-request, request |
| Q-06 | What must the shop record and tell the person when it refuses a request or does not act on it (PRIV-05, PRIV-06)? | A privacy lawyer | Not covered by this feature: a refusal cannot be recorded | answer-a-request |
| Q-07 | Is proof of identity that arrived enough to treat the identity as confirmed, or must the shop record whether it was enough? | A privacy lawyer | Proof received counts as confirmed, and proof is asked for once (D-10) | answer-a-request, request |
| Q-08 | May the shop ask for proof of identity after the due date (PRIV-07)? | A privacy lawyer | No: Ask for proof of identity is offered only before the due date | answer-a-request, request |
| Q-09 | When a person asks for the answer by another channel (PRIV-04), what must the shop record? | A privacy lawyer | The screen records the date the answer was sent, and does not name the channel | answer-a-request, request |
