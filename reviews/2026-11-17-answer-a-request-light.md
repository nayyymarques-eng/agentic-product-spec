# Spec review, light: Answer a request

Review: light
Spec hash: d41f3925b282
Structure hash: 56a9e3e9cc83

- Feature: `spec/flows/answer-a-request.md` and `spec/screens/request.md`
- Change reviewed: D-07, BR-02 and the Extend dialog's question now say an extension rests on a ground PRIV-02 gives (the request is complex, or there are many requests); waiting for proof is not a ground on its own. What the feature does is unchanged, so the structure hash is the one of the full review, round 7 (`2026-11-17-answer-a-request.md`).
- Role: privacy lead (R-01), persona sheet `spec/personas/privacy-lead.md`
- Reviewer: the synthetic user, one run. A person read the run.
- Date: 2026-11-17
- Result: ready to merge. No finding goes against an external rule or a decision. Each finding below is a follow-up or a question for a lawyer.

## Findings, and where each went

| Finding | Goes against | Where it went |
|---|---|---|
| The Extend dialog accepts any written reason, so over a request waiting for proof the lead can still write "waiting for ID" | Neither | Follow-up 11 |
| "There are many requests" can mean this person's requests or the shop's volume; D-07's why ("a busy month") takes the broader reading | Neither | Question for a lawyer, below |
| The dialog title says "by two months", while at month end the product adds more (E-29) | Neither | Q-03 holds the reading; follow-up 12 |
| Dialog-over-state evals missing: Extend over ST-05 not extended, Mark as answered over ST-02, a dialog open when another tab moves the state | Neither | Follow-ups 3 and 10 of the full review |

## Follow-ups

11. Over a request waiting for proof, have the Extend dialog say that waiting for proof is not a reason on its own; or let the lead pick one of the two grounds, then write the details. Otherwise list "whether the written reason is a PRIV-02 ground" under `## Not covered`, as for doubts.
12. Show the new due date in the Extend dialog before the lead confirms, or word its title so it does not promise exactly two months.

## Questions for a privacy lawyer

- In Art. 12(3), does "the number of requests" mean this person's requests or the shop's overall volume?
- Can the need to confirm identity count as part of a request's complexity?
