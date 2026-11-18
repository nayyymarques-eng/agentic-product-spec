# Handoff: Request

Written by `npm run handoff` from `spec/screens/request.md` and the files it cites. Do not edit it: change the spec and run it again.

## The screen

- Template: detail-page (ai-ready-design-system, `contracts/detail-page.md`)
- Used by: Privacy lead (R-01), Support agent (R-02)
- Goals: Answer every request within the legal time (G-01); See first what needs action (G-02); Show later what was done, by whom and when (G-03); Hand a request on, and know it reached the privacy lead (G-04)
- Never shows: €, fee, price
- Shows in every state: "Reached the shop on {received}", "Sent to the privacy lead on {sent}", "Due date: {due}"
- Shows when it happened: "Extended on {extended}. Reason: {reason}", "Proof of identity asked for on {asked}. Doubt: {doubt}", "Proof of identity received on {arrived}"

## Flow: Answer a request

From `spec/flows/answer-a-request.md`. Starts when a person writes to the shop asking for a copy of their personal data. Each box names the states of this screen it lands on.

```mermaid
flowchart TD
  T(["a person writes to the shop asking for a copy of their personal data"])
  T --> F01
  F01["F-01 The support agent reads the email and sends it to the privacy lead<br/>ST-07"]
  F02["F-02 The privacy lead opens the request and sees its due date<br/>ST-01, ST-02, ST-03"]
  F03{"F-03 Is it clear who the person is?"}
  F04["F-04 Writes the doubt, asks for proof of identity, and waits<br/>DL-02, ST-05, ST-08"]
  F05{"F-05 Can the answer go out by the due date?"}
  F06["F-06 Extends the due date by two months, with a reason for the person<br/>DL-01, ST-04, ST-02, ST-05, ST-08"]
  F07["F-07 Sends the answer, and records the date it was sent<br/>DL-03, ST-06, ST-10"]
  F08["F-08 The due date passes with no answer<br/>ST-03, ST-09"]
  F01 --> F02
  F02 --> F03
  F02 -- "when the due date passes" --> F08
  F03 -- "yes" --> F05
  F03 -- "no" --> F04
  F04 -- "when the proof arrives, F-06 to extend while waiting" --> F05
  F04 -- "when the due date passes" --> F08
  F05 -- "yes" --> F07
  F05 -- "no, and not extended yet" --> F06
  F05 -- "no, and already extended" --> F08
  F06 --> F07
  F06 -- "when the new due date passes" --> F08
  F07 --> E(["the privacy lead has recorded the date the answer was sent"])
  F08 --> F07
```

## Rules

Each rule is a requirement. Its sources say why, so a change upstream finds this screen.

| ID | Rule | Sources |
|---|---|---|
| BR-01 | The due date is one month after the day the request reached the shop, not the day the support agent sent it on or the day the privacy lead opened it. | PRIV-01, Q-02, Q-03 |
| BR-02 | The privacy lead can extend the due date once, before it passes, by two more months, and only after writing the reason that goes into the letter to the person: the request is complex, or there are many requests. | PRIV-02, PRIV-03, D-04, D-07, D-09, Q-04 |
| BR-03 | A request past its due date and not answered is overdue, and says so until someone closes it. An answer after the due date says how late it was. | PRIV-01, D-02, D-08 |
| BR-04 | The privacy lead marks a request as answered with the date the answer was sent: not after today, and not before the request reached the shop or before anything recorded on it since. The product sends nothing to the person. | PRIV-04, D-01, D-09, Q-05 |
| BR-05 | The privacy lead asks for proof of identity once, before the due date, and only with a reasonable doubt, written down. The due date does not move while the lead waits. | PRIV-07, D-05, D-09, D-10, Q-01, Q-07, Q-08 |
| BR-06 | Answering is free, and the product never charges for a copy. No screen shows a fee or a price. | PRIV-06, PRIV-08 |
| BR-07 | A request is due soon from 7 days before its due date. | D-06, G-02 |
| BR-08 | A support agent sees who has the request and the day they sent it, and nothing they can change. | R-02 |

## Conditions

What decides the state. Each condition takes one value at a time; the States table below says which values each state needs.

| Condition | Value | From the facts |
|---|---|---|
| Viewer | lead | Viewer is R-01 |
| Viewer | support | Viewer is R-02 |
| Answered | no | Answered on is - |
| Answered | on time | Answered on is on or before Due |
| Answered | late | Answered on is after Due |
| Due date | more than 7 days | Today is more than 7 days before Due |
| Due date | 7 days or less | Today is 0 to 7 days before Due |
| Due date | passed | Today is after Due |
| Proof | not asked | Proof asked on is - |
| Proof | waiting | Proof asked on is set, Proof received on is - |
| Proof | arrived | Proof received on is set |
| Extended | no | Extended on is - |
| Extended | yes | Extended on is set |

## States

When two states could apply, the first one wins.

| ID | State | When | Status | Actions | Never shows |
|---|---|---|---|---|---|
| ST-07 | Support agent's view | Viewer support | none: "With the privacy lead" | none | what happened, "Due date" |
| ST-10 | Answered late | Viewer lead, Answered late | warning: "Answered {late} late" | none | - |
| ST-06 | Answered | Viewer lead, Answered on time | positive: "Answered on {answered}" | none | - |
| ST-09 | Overdue, waiting for proof of identity | Viewer lead, Answered no, Due date passed, Proof waiting | critical: "Overdue by {overdue}" | Proof received (primary), Mark as answered (tertiary) | - |
| ST-03 | Overdue | Viewer lead, Answered no, Due date passed | critical: "Overdue by {overdue}" | Mark as answered (primary) | - |
| ST-08 | Waiting for proof of identity, due soon | Viewer lead, Answered no, Due date 7 days or less, Proof waiting | warning: "Due {in}" | Proof received (primary), Extend (secondary) unless already extended, Mark as answered (tertiary) | - |
| ST-05 | Waiting for proof of identity | Viewer lead, Answered no, Due date more than 7 days, Proof waiting | none: "Waiting for proof of identity" | Proof received (primary), Extend (secondary) unless already extended, Mark as answered (tertiary) | - |
| ST-02 | Due soon | Viewer lead, Answered no, Due date 7 days or less | warning: "Due {in}" | Mark as answered (primary), Extend (secondary) unless already extended, Ask for proof of identity (tertiary) unless already asked | - |
| ST-04 | Extended | Viewer lead, Answered no, Due date more than 7 days, Extended yes | info: "Extended to {due}" | Mark as answered (primary), Ask for proof of identity (tertiary) unless already asked | - |
| ST-01 | Open | Viewer lead, Answered no, Due date more than 7 days, Proof not asked or arrived, Extended no | info: "Due on {due}" | Mark as answered (primary), Extend (secondary), Ask for proof of identity (tertiary) unless already asked | - |

## Dialogs

A dialog opens over a state, which keeps its status and banner. It shows only over the states it lists, while that state still offers the button that opens it, and closes otherwise.

| ID | Dialog | Opens from | Over | Asks | Actions | Closes when |
|---|---|---|---|---|---|---|
| DL-01 | Extend the due date by two months | Extend | ST-01, ST-02, ST-05, ST-08 | Why it needs more time: the request is complex, or there are many requests. For the letter to the person | Extend (primary, disabled until written), Cancel (tertiary) | the due date passes, or the request is extended or answered in another tab. Nothing is extended. |
| DL-02 | Ask for proof of identity | Ask for proof of identity | ST-01, ST-02, ST-04 | Your doubt about who wrote | Ask (primary, disabled until written), Cancel (tertiary) | the due date passes, or proof is asked for or the request answered in another tab. Nothing is asked. |
| DL-03 | Mark as answered | Mark as answered | ST-01, ST-02, ST-03, ST-04, ST-05, ST-08, ST-09 | Date the answer was sent | Mark as answered (primary, disabled until written), Cancel (tertiary) | the request is answered in the meantime, by someone else or in another tab. While it is not answered, answering is always possible. |

## Acceptance tests

One per eval in the spec. `npm run behaviour` runs the screen's evals against the built screen.

- **E-01.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 10 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, and it offers Mark as answered, Extend, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-02.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 28 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-02 Due soon, and it offers Mark as answered, Extend, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-03.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 4 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-03 Overdue, and it offers Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03.
- **E-04.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, opened by the privacy lead on 25 Nov 2026. Then the due date is 3 Feb 2027, the screen is in ST-04 Extended, and it offers Mark as answered, Ask for proof of identity. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-05.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 20 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-05 Waiting for proof of identity, and it offers Proof received, Extend, Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-06.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, answered on 28 Nov 2026, opened by the privacy lead on 10 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-06 Answered, and it offers no action. Rests on external rules still to confirm: PRIV-04.
- **E-07.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-01 Extend dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, the DL-01 dialog shows over it, and it offers Extend, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-08.** Given a request received 3 Nov 2026, sent on 6 Nov 2026, opened by the support agent on 20 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-07 Support agent's view, and it offers no action.
- **E-09.** Given a request received 31 Jan 2026, sent on 31 Jan 2026, opened by the privacy lead on 10 Feb 2026. Then the due date is 28 Feb 2026, the screen is in ST-01 Open, and it offers Mark as answered, Extend, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-10.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, opened by the privacy lead on 30 Jan 2027. Then the due date is 3 Feb 2027, the screen is in ST-02 Due soon, and it offers Mark as answered, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-11.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, opened by the privacy lead on 5 Feb 2027. Then the due date is 3 Feb 2027, the screen is in ST-03 Overdue, and it offers Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03.
- **E-12.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 5 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-09 Overdue, waiting for proof of identity, and it offers Proof received, Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-07.
- **E-13.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 3 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-02 Due soon, and it offers Mark as answered, Extend, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-14.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, answered on 28 Nov 2026, opened by the support agent on 10 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-07 Support agent's view, and it offers no action.
- **E-16.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 28 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-08 Waiting for proof of identity, due soon, and it offers Proof received, Extend, Mark as answered. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-17.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, proof asked on 25 Nov 2026, opened by the privacy lead on 1 Dec 2026. Then the due date is 3 Feb 2027, the screen is in ST-05 Waiting for proof of identity, and it offers Proof received, Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-18.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, proof received on 15 Nov 2026, opened by the privacy lead on 20 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, and it offers Mark as answered, Extend. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-19.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 4 Dec 2026, with the DL-01 Extend dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-03 Overdue, the DL-01 dialog has closed, and it offers Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03.
- **E-20.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 28 Nov 2026, with the DL-01 Extend dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-02 Due soon, the DL-01 dialog shows over it, and it offers Extend, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-21.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 28 Nov 2026, with the DL-01 Extend dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-08 Waiting for proof of identity, due soon, the DL-01 dialog shows over it, and it offers Extend, Cancel. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-22.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, answered on 5 Dec 2026, opened by the privacy lead on 10 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-10 Answered late, and it offers no action. Rests on external rules still to confirm: PRIV-01, PRIV-04.
- **E-23.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the support agent on 5 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-07 Support agent's view, and it offers no action.
- **E-24.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 5 Dec 2026, with the DL-03 Mark as answered dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-03 Overdue, the DL-03 dialog shows over it, and it offers Mark as answered, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03.
- **E-25.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 5 Dec 2026, with the DL-03 Mark as answered dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-09 Overdue, waiting for proof of identity, the DL-03 dialog shows over it, and it offers Mark as answered, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-07.
- **E-26.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-02 Ask for proof of identity dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, the DL-02 dialog shows over it, and it offers Ask, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-27.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 26 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-02 Due soon, and it offers Mark as answered, Extend, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-28.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 25 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, and it offers Mark as answered, Extend, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-29.** Given a request received 31 Jan 2026, sent on 31 Jan 2026, extended on 10 Feb 2026, opened by the privacy lead on 20 Feb 2026. Then the due date is 30 Apr 2026, the screen is in ST-04 Extended, and it offers Mark as answered, Ask for proof of identity. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-30.** Given a request received 31 Jan 2028, sent on 31 Jan 2028, opened by the privacy lead on 10 Feb 2028. Then the due date is 29 Feb 2028, the screen is in ST-01 Open, and it offers Mark as answered, Extend, Ask for proof of identity. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-35.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-01 Extend dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, the DL-01 dialog shows over it, and it offers Extend, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-36.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 4 Dec 2026, with the DL-02 Ask for proof of identity dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-03 Overdue, the DL-02 dialog has closed, and it offers Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03.
- **E-37.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, proof received on 5 Dec 2026, opened by the privacy lead on 6 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-03 Overdue, and it offers Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03.
- **E-38.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-03 Mark as answered dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, the DL-03 dialog shows over it, and it offers Mark as answered, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-39.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, answered on 20 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-03 Mark as answered dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-06 Answered, the DL-03 dialog has closed, and it offers no action. Rests on external rules still to confirm: PRIV-04.
- **E-40.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, proof asked on 25 Nov 2026, opened by the privacy lead on 1 Dec 2026, with the DL-01 Extend dialog opened and something written in it. Then the due date is 3 Feb 2027, the screen is in ST-05 Waiting for proof of identity, the DL-01 dialog has closed, and it offers Proof received, Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-41.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, proof asked on 20 Jan 2027, opened by the privacy lead on 30 Jan 2027. Then the due date is 3 Feb 2027, the screen is in ST-08 Waiting for proof of identity, due soon, and it offers Proof received, Mark as answered. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-42.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, proof asked on 20 Jan 2027, opened by the privacy lead on 5 Feb 2027. Then the due date is 3 Feb 2027, the screen is in ST-09 Overdue, waiting for proof of identity, and it offers Proof received, Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-07.
- **E-43.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, answered on 28 Nov 2026, opened by the privacy lead on 10 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-06 Answered, and it offers no action. Rests on external rules still to confirm: PRIV-04.
- **E-44.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 5 Dec 2026, with the DL-01 Extend dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-09 Overdue, waiting for proof of identity, the DL-01 dialog has closed, and it offers Proof received, Mark as answered. Rests on external rules still to confirm: PRIV-01, PRIV-07.
- **E-45.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, proof asked on 25 Nov 2026, opened by the support agent on 1 Dec 2026. Then the due date is 3 Feb 2027, the screen is in ST-07 Support agent's view, and it offers no action.
- **E-46.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, proof received on 15 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-02 Ask for proof of identity dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-01 Open, the DL-02 dialog has closed, and it offers Mark as answered, Extend. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-06, PRIV-07, PRIV-08.
- **E-47.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, answered on 20 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-01 Extend dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-06 Answered, the DL-01 dialog has closed, and it offers no action. Rests on external rules still to confirm: PRIV-04.
- **E-48.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, answered on 20 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-02 Ask for proof of identity dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-06 Answered, the DL-02 dialog has closed, and it offers no action. Rests on external rules still to confirm: PRIV-04.
- **E-49.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, answered on 5 Dec 2026, opened by the privacy lead on 10 Dec 2026. Then the due date is 3 Dec 2026, the screen is in ST-10 Answered late, and it offers no action. Rests on external rules still to confirm: PRIV-01, PRIV-04.
- **E-50.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, proof received on 15 Nov 2026, opened by the privacy lead on 28 Nov 2026. Then the due date is 3 Dec 2026, the screen is in ST-02 Due soon, and it offers Mark as answered, Extend. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-51.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, proof asked on 12 Nov 2026, proof received on 15 Nov 2026, opened by the privacy lead on 25 Nov 2026. Then the due date is 3 Feb 2027, the screen is in ST-04 Extended, and it offers Mark as answered. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-52.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, opened by the privacy lead on 25 Nov 2026, with the DL-02 Ask for proof of identity dialog opened and nothing written in it yet. Then the due date is 3 Feb 2027, the screen is in ST-04 Extended, the DL-02 dialog shows over it, and it offers Ask, Cancel. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-53.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, opened by the privacy lead on 28 Nov 2026, with the DL-02 Ask for proof of identity dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-02 Due soon, the DL-02 dialog shows over it, and it offers Ask, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-54.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 20 Nov 2026, with the DL-03 Mark as answered dialog opened and nothing written in it yet. Then the due date is 3 Dec 2026, the screen is in ST-05 Waiting for proof of identity, the DL-03 dialog shows over it, and it offers Mark as answered, Cancel. Rests on external rules still to confirm: PRIV-01, PRIV-02, PRIV-03, PRIV-07.
- **E-55.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, proof asked on 12 Nov 2026, opened by the privacy lead on 28 Nov 2026, with the DL-03 Mark as answered dialog opened and something written in it. Then the due date is 3 Dec 2026, the screen is in ST-08 Waiting for proof of identity, due soon, the DL-03 dialog shows over it, and it offers Mark as answered, Cancel. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.
- **E-56.** Given a request received 3 Nov 2026, sent on 3 Nov 2026, extended on 20 Nov 2026, opened by the privacy lead on 25 Nov 2026, with the DL-03 Mark as answered dialog opened and nothing written in it yet. Then the due date is 3 Feb 2027, the screen is in ST-04 Extended, the DL-03 dialog shows over it, and it offers Mark as answered, Cancel. Rests on external rules still to confirm: PRIV-02, PRIV-03, PRIV-07.

From the flow Answer a request, for what no screen shows. The backend's own tests run these.

- **E-15.** Given the privacy lead marks a request as answered, with the date the answer was sent. Then the product sends no email or message to the person, and records the date the lead entered. (BR-04) Rests on external rules still to confirm: PRIV-04.
- **E-31.** Given the privacy lead enters an answer date after today, before the request reached the shop, or before its extension or a proof of identity asked for or received. Then the request is not marked as answered, and the field says which date is allowed. (BR-04) Rests on external rules still to confirm: PRIV-04.
- **E-32.** Given the privacy lead extends a request with a reason. Then the product sends nothing to the person, and records the reason and the day of the extension. (BR-02) Rests on external rules still to confirm: PRIV-02, PRIV-03.
- **E-33.** Given the privacy lead asks for proof of identity with a doubt written. Then the product sends nothing to the person, and records the doubt and the day it was asked. (BR-05) Rests on external rules still to confirm: PRIV-07.
- **E-34.** Given the support agent sends a request on some days after it reached the shop. Then the due date counts from the day it reached the shop, and the day it was sent is recorded apart. (BR-01, BR-08) Rests on external rules still to confirm: PRIV-01.

## Decisions behind it

- **D-01.** The product does not send answers to the person. The privacy lead sends them from the shop's own email and marks the request as answered, with the date sent.
- **D-02.** A request past its due date stays at the top of the list, marked "overdue", until someone closes it. It never leaves the list on its own.
- **D-04.** A request is extended once, always by the full two months.
- **D-05.** While the lead waits for proof of identity, the due date does not move.
- **D-06.** A request is "due soon" from 7 days before its due date.
- **D-07.** While the lead waits for proof of identity, the request can still be extended, on a ground PRIV-02 gives: the request is complex, or there are many requests. Waiting for proof is not a ground on its own. The request shows as due soon in its last 7 days.
- **D-08.** An answer sent after the due date shows as answered late, with the number of days.
- **D-09.** Each dialog that needs a written reason, doubt or date keeps its main button disabled until it is written.
- **D-10.** Proof of identity is asked for once per request.

## Open questions

Built as "meanwhile" says. When the answer comes, the spec changes in one place, and this handoff with it.

- **Q-01.** Does the month stop while the shop waits for proof of identity (PRIV-07)? Meanwhile, the due date does not move (D-05).
- **Q-02.** How is "one month" counted when the next month has no such day, such as a request received on 31 January? Meanwhile, the due date is the last day of the next month.
- **Q-03.** Once extended, is the due date three months after the request reached the shop, or two months after the first due date? They differ at month end: a request received on 31 January is due on 30 April or 28 April. Meanwhile, three months after the request reached the shop.
- **Q-04.** Must the person be told about the extension within the first month, and can a request be extended on its due date? Meanwhile, extend works up to and including the due date. The product records the reason, not the day the letter went out.
- **Q-05.** May a request be answered while proof of identity is still awaited? Meanwhile, mark as answered stays, as the least prominent action.
- **Q-07.** Is proof of identity that arrived enough to treat the identity as confirmed, or must the shop record whether it was enough? Meanwhile, proof received counts as confirmed, and proof is asked for once (D-10).
- **Q-08.** May the shop ask for proof of identity after the due date (PRIV-07)? Meanwhile, no: Ask for proof of identity is offered only before the due date.

## External rules

- **PRIV-01** (GDPR Art. 12(3), to confirm): Answer a request about personal data (access, correction, erasure, restriction, portability, objection) without undue delay, and within one month of receiving it at the latest.
- **PRIV-02** (GDPR Art. 12(3), to confirm): The month can be extended by two more months when needed, given how complex the requests are and how many there are.
- **PRIV-03** (GDPR Art. 12(3), to confirm): The person must be told of an extension within one month of the request, with the reasons.
- **PRIV-04** (GDPR Art. 12(3), to confirm): A request made electronically is answered electronically where possible, unless the person asks otherwise.
- **PRIV-06** (GDPR Art. 12(5), to confirm): Answering is free. Only for a request that is manifestly unfounded or excessive, in particular repetitive, may the shop charge a reasonable fee or refuse, and the shop must be able to show why.
- **PRIV-07** (GDPR Art. 12(6), to confirm): Only with reasonable doubts about who made the request may the shop ask for more information, and only what is needed to confirm identity.
- **PRIV-08** (GDPR Art. 15(3), to confirm): The person gets a copy of their personal data. Further copies may cost a reasonable fee based on administrative costs.
