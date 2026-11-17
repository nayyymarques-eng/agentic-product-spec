# Spec review: Answer a request

Spec hash: 079fa5cf3a0f

- Feature: `spec/flows/answer-a-request.md` and `spec/screens/request.md`
- Role: privacy lead (R-01), persona sheet `spec/personas/privacy-lead.md`
- Reviewer: the synthetic user from grounded-synthetic-user, in a spec review, run three times, each run alone. A person aggregated the runs.
- Date: 2026-11-17
- Result: ready to merge, by `spec/README.md`, "When a feature is ready to merge". No finding two runs agree on goes against an external rule or a decision. Every other agreed finding is fixed, an open question, under `## Not covered`, or a follow-up below.

## How it got here

This is the last of three rounds. Each round ran three times, on the version named by its hash, and kept what two runs agreed on.

| Round | Spec hash | Agreed findings against a rule or a decision | What changed after it |
|---|---|---|---|
| 3 | 7b9500c8bf89 | One: in a race between two tabs, Extend could run twice, against D-04 | A dialog shows only while the state under it offers its button. Lines for what happened, a state that never shows them (the support agent saw the lead's notes), proof asked once (D-10), Q-07 to Q-09, 15 evals |
| 4 | 45dcf789b1d2 | None | The due date in every state the lead sees, the reason and the doubt in the history, dialogs closing when the request is answered elsewhere, 10 evals |
| 5 | 079fa5cf3a0f | None | This report |

## Agreed findings of round 5, and where each went

| Finding | Runs | Goes against | Where it went |
|---|---|---|---|
| The answer date may not be earlier than a recorded proof received, extension or ask, which record the day of the click. A lead who records the proof after sending the answer must enter a later, false date, and an answer on time shows as late. Round 4 added that floor | 3 of 3 | Neither, though it works against the aim of D-08 | Follow-up 1 |
| Nothing says that an action sent from a stale tab, or at the day change, is refused and records nothing: a second Proof received, Extend after an extension, Mark as answered after an answer | 3 of 3 | Neither | Follow-up 2 |
| Evals missing: Extend over ST-05 while not extended, Mark as answered over ST-02, an extended request answered late, proof asked and then extended | 3 of 3 | Neither | Follow-up 3 |
| The support agent sees "Reached the shop on", which BR-08 does not list | 3 of 3, low evidence | Neither | Follow-up 4 |
| Overdue while waiting for proof, Proof received leads and the answer is the least prominent; the banner leaves out that the request stays on top | 2 of 3 | Neither | Q-05 holds the button order; follow-up 5 for the banner |
| Mark as answered over a request waiting for proof does not say identity is unconfirmed | 2 of 3 | Neither | Q-05 |
| The Extend dialog speaks of "the letter", while the product sends nothing, and the original due date, by which the person must be told, is no longer shown | 2 of 3 | Neither | Q-04; follow-up 6 for the wording |
| A doubt or a reason of one character passes | 3 of 3, low evidence | Neither | Not covered |
| A refusal cannot be recorded; a dialog that closes on its own loses what was written; Proof received has no date or undo; who enters Received | 3 of 3, as risks | Neither | Not covered, Q-06, Q-07 |

## Follow-ups, for the next change to this feature

1. Let the lead enter the day proof arrived, and the day of an extension or an ask, within the same bounds as the answer date; or drop those events from the answer date's floor. Add an eval for an answer recorded before the proof.
2. Add flow evals: an action sent after it stopped being offered is refused, records nothing and sends nothing.
3. Add the four evals above.
4. Decide whether the support agent sees the day the request reached the shop, and say it in ST-07.
5. Keep the sentence "It stays at the top of your list until you mark it as answered" in the ST-09 banner.
6. Word the Extend dialog so it says the lead sends the letter, and show the original due date in the history line of the extension.

## Questions for a privacy lawyer

Q-01 to Q-09 in `spec/questions.md`. The rounds raised no new one: each agreed question is already there.
