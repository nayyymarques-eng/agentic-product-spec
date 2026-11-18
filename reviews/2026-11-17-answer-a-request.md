# Spec review: Answer a request

Spec hash: fec1ae911e79
Structure hash: 658025128f4b

- Feature: `spec/flows/answer-a-request.md` and `spec/screens/request.md`
- Role: privacy lead (R-01), persona sheet `spec/personas/privacy-lead.md`
- Reviewer: the synthetic user from grounded-synthetic-user, in a spec review, run three times, each run alone. A person aggregated the runs.
- Date: 2026-11-17, round 8 on 2026-11-18
- Result: round 7 agreed on one finding against a decision: D-07 allowed an extension on a ground PRIV-02 does not name. D-07's owner chose to keep Extend while waiting for proof, on a PRIV-02 ground only, and the wording was fixed; the light review of that fix is `2026-11-17-answer-a-request-light.md`. Every other agreed finding is fixed, an open question, under `## Not covered`, or a follow-up below. Round 8, after SPEC-18 added a step's landing, agreed on nothing against a rule or a decision.

## How it got here

These are the last rounds. Each round ran three times, on the version named by its hash, and kept what two runs agreed on.

| Round | Spec hash | Agreed findings against a rule or a decision | What changed after it |
|---|---|---|---|
| 3 | 7b9500c8bf89 | One: in a race between two tabs, Extend could run twice, against D-04 | A dialog shows only while the state under it offers its button. Lines for what happened, a state that never shows them (the support agent saw the lead's notes), proof asked once (D-10), Q-07 to Q-09, 15 evals |
| 4 | 45dcf789b1d2 | None | The due date in every state the lead sees, the reason and the doubt in the history, dialogs closing when the request is answered elsewhere, 10 evals |
| 5 | 079fa5cf3a0f | None | The intro of the flow's Decisions section: every decision made for a feature lives in its feature decision log. A wording change, but it changes the hash, so the review ran again |
| 6 | c31bb90dd434 | None | The states written as a decision table, checked by SPEC-17. The table changes the structure, so the review ran three times again |
| 7 | b3c9705c4f50 | One: D-07 lets the lead extend because proof is late, and PRIV-02 names only the complexity and number of requests (2 of 3) | D-07, BR-02 and the Extend dialog reworded: extend while waiting only on a PRIV-02 ground. A rewording, so one light run |
| 8 | fec1ae911e79 | None | The new check SPEC-18 found that F-06 did not land on ST-02, where an extended request goes in its last 7 days. F-06 now lands there. A change to a step, so the review ran three times again |

## Agreed findings of rounds 5 to 7, and where each went

Round 6 agreed again on every round 5 finding below, and added three rows. Round 7, on the decision table, added the last five.

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
| Round 6: the extension letter and the proof request leave the product by no step, and no decision says the lead sends them, as D-01 does for the answer | 3 of 3 | Neither | Q-04; follow-up 6 |
| Round 6: while Q-03 is open, the due date of an extended request takes the later of the two readings, so a lead could be late under the other one | 2 of 3 | Neither | Q-03; follow-up 7 |
| Round 6: Ask for proof of identity is offered on the due date itself, while BR-05 says "before the due date" | 1 of 3, kept because it is the spec against itself | Neither | Follow-up 8 |
| Round 7: D-07 offers Extend while waiting for proof, because proof can arrive late. PRIV-02 allows an extension for the complexity and number of requests | 2 of 3 | D-07, and possibly PRIV-02 (`to confirm`) | Fixed: D-07 reworded by its owner |
| Round 7: the record of an ask keeps the doubt but not what was asked of the person, so the shop cannot show it asked only for what PRIV-07 allows | 3 of 3 | Neither: a risk under PRIV-07, not a breach (2 of 3) | Follow-up 9 |
| Round 7: the answer-date floor of round 5, again | 3 of 3 | Neither (2 of 3; one run read it as against D-01) | Follow-up 1 |
| Round 7: evals missing: an extended request answered on time and late, a support agent on a request answered late, and the round 5 dialog cases | 3 of 3 | Neither | Follow-up 3 |
| Round 7: a dialog open when another tab moves the request to a state the dialog still lists (Extend while proof is asked or recorded elsewhere) | 2 of 3 | Neither | Follow-up 10 |
| Round 8: the answer-date floor, again | 3 of 3 | Neither | Follow-up 1 |
| Round 8: evals missing: an answer on the due date itself, an extended request answered on time and late, Extend over ST-05, Mark as answered over ST-02. The screen's note says E-53 to E-56 cover every dialog over the states it lists, which is not true for these two | 3 of 3 | Neither | Follow-up 3 |
| Round 8: the record of an ask keeps the doubt but not what was asked of the person (PRIV-07) | 3 of 3 | Neither: a risk under PRIV-07 | Follow-up 9 |
| Round 8: the Extend dialog accepts any reason, so "waiting for proof" can be written, which D-07 says is not a ground | 2 of 3 | Neither: a risk under PRIV-02; the dialog follows D-07's words but does not enforce them | Follow-up 11 |
| Round 8: Ask for proof of identity is offered on the due date itself, while BR-05 and Q-08 say "before the due date" | 2 of 3 | Neither | Follow-up 8 |
| Round 8: no step records that proof arrived, and after an extension no step leads to asking for proof, though the screen offers both | 3 of 3 | Neither | Follow-up 13 |

## Follow-ups, for the next change to this feature

1. Let the lead enter the day proof arrived, and the day of an extension or an ask, within the same bounds as the answer date; or drop those events from the answer date's floor. Add an eval for an answer recorded before the proof.
2. Add flow evals: an action sent after it stopped being offered is refused, records nothing and sends nothing.
3. Add the evals the screen does not have yet: the Extend dialog open over a request waiting for proof that was not extended (ST-05); the Mark as answered dialog open over a request due soon (ST-02); an extended request answered before its new due date (ST-06) and after it (ST-10, late counted from the new date); a support agent on a request answered late (ST-07); and proof asked for first, then the request extended while still waiting.
4. Decide whether the support agent sees the day the request reached the shop, and say it in ST-07.
5. Keep the sentence "It stays at the top of your list until you mark it as answered" in the ST-09 banner.
6. Word the Extend dialog so it says the lead sends the letter, from the shop's email, and the product sends nothing; do the same for the proof request. Show the original due date in the history line of the extension.
7. While Q-03 is open, consider the earlier reading as the "meanwhile": two months after the first due date is never later than the law allows under either reading.
8. Make Ask for proof of identity and BR-05 agree on the due date itself: either stop offering it on that day, or write "up to and including the due date" in BR-05, as Q-04 does for Extend.
9. Have the proof dialog also ask what the lead asked the person for, and show it in the history line; or list it under `## Not covered` with a question for a lawyer.
10. Add evals for a dialog that stays open when another tab moves the request to a state it still lists: Extend open while proof is asked for, or recorded, elsewhere.
11. and 12. are in the light review of round 7.
13. Add a step for recording that proof arrived, reached from F-04, F-06 and F-08, and add to F-06's Next a way to ask for proof after an extension. SPEC-18 follows only time; a step driven by an action the lead takes is still found by reading.

## Questions for a privacy lawyer

Q-01 to Q-09 in `spec/questions.md`. The rounds raised no new one: each agreed question is already there.
