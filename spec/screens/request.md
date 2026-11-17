# Screen: Request

One request, opened from the privacy lead's list: the person's message, its due date, what to do next and what was done.

- Template: detail-page
- Roles: R-01, R-02
- Goals: G-01, G-02, G-03, G-04
- Never shows: €, fee, price
- Shows in every state: "Reached the shop on {received}", "Sent to the privacy lead on {sent}", "Due date: {due}"
- Shows when it happened: "Extended on {extended}. Reason: {reason}", "Proof of identity asked for on {asked}. Doubt: {doubt}", "Proof of identity received on {arrived}"

## Words

The words in braces come from the eval row. A line under "Shows when it happened" shows once every word in it has a value, in every state that does not say it never shows what happened. What a state never shows also wins over a line shown in every state. A date shows as "3 Dec", with the year when it is not Today's year: "3 Feb 2027".

| Word | What it is |
|---|---|
| {due} | The Due column |
| {in} | From Today to the Due column: "today", "tomorrow" or "in 5 days" |
| {overdue} | From the Due column to Today: "1 day" or "2 days" |
| {late} | From the Due column to the Answered on column: "1 day" or "2 days" |
| {received} | The Received column: the day the request reached the shop |
| {sent} | The Sent on column: the day the support agent sent it to the privacy lead |
| {asked} | The Proof asked on column |
| {answered} | The Answered on column |
| {extended} | The Extended on column |
| {arrived} | The Proof received on column |
| {reason} | The reason the lead wrote in Extend. The evals use one sample reason |
| {doubt} | The doubt the lead wrote in Ask for proof of identity. The evals use one sample doubt |

## Conditions

What decides the state. Each condition takes one value at a time, and each value says how an eval's facts set it. The decision table under `## States` uses them.

| Condition | Value | From the eval's facts |
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

The decision table says when each state applies. The rows are tried in order, and the first one that matches wins. A "-" matches any value. When two rows match the same situation, an eval says which one wins and what it keeps. A dialog is not a state: it opens over one, under `## Dialogs`.

| State | Viewer | Answered | Due date | Proof | Extended |
|---|---|---|---|---|---|
| ST-07 Support agent's view | support | - | - | - | - |
| ST-10 Answered late | lead | late | - | - | - |
| ST-06 Answered | lead | on time | - | - | - |
| ST-09 Overdue, waiting for proof of identity | lead | no | passed | waiting | - |
| ST-03 Overdue | lead | no | passed | - | - |
| ST-08 Waiting for proof of identity, due soon | lead | no | 7 days or less | waiting | - |
| ST-05 Waiting for proof of identity | lead | no | more than 7 days | waiting | - |
| ST-02 Due soon | lead | no | 7 days or less | - | - |
| ST-04 Extended | lead | no | more than 7 days | - | yes |
| ST-01 Open | lead | no | more than 7 days | not asked, arrived | no |

### ST-07 Support agent's view
- Status: badge none "With the privacy lead"
- Banner: none
- Actions: none
- Never shows: what happened, "Due date"
- Rules: BR-08
- Goals: G-04

### ST-10 Answered late
- Status: badge warning "Answered {late} late"
- Banner: none
- Actions: none
- Says: "Answer sent on {answered}, {late} after the due date"
- Rules: BR-04, BR-03
- Goals: G-01, G-03

### ST-06 Answered
- Status: badge positive "Answered on {answered}"
- Banner: none
- Actions: none
- Says: "Answer sent on {answered}"
- Rules: BR-04
- Goals: G-01, G-03

### ST-09 Overdue, waiting for proof of identity
- Status: badge critical "Overdue by {overdue}"
- Banner: critical "This request is past its due date. You asked for proof of identity on {asked} and it has not arrived."
- Actions: Proof received (primary), Mark as answered (tertiary)
- Rules: BR-03, BR-05
- Goals: G-01, G-02

### ST-03 Overdue
- Status: badge critical "Overdue by {overdue}"
- Banner: critical "This request is past its due date. It stays at the top of your list until you mark it as answered."
- Actions: Mark as answered (primary)
- Rules: BR-03, BR-02
- Goals: G-01, G-02

### ST-08 Waiting for proof of identity, due soon
- Status: badge warning "Due {in}"
- Banner: info "You asked for proof of identity on {asked}. Waiting does not move the due date."
- Actions: Proof received (primary), Extend (secondary) unless already extended, Mark as answered (tertiary)
- Rules: BR-05, BR-07, BR-02
- Goals: G-01, G-02

### ST-05 Waiting for proof of identity
- Status: badge none "Waiting for proof of identity"
- Banner: info "You asked for proof of identity on {asked}. Waiting does not move the due date: {due}."
- Actions: Proof received (primary), Extend (secondary) unless already extended, Mark as answered (tertiary)
- Rules: BR-05, BR-01, BR-02
- Goals: G-01

### ST-02 Due soon
- Status: badge warning "Due {in}"
- Banner: none
- Actions: Mark as answered (primary), Extend (secondary) unless already extended, Ask for proof of identity (tertiary) unless already asked
- Rules: BR-07, BR-01, BR-02, BR-05
- Goals: G-01, G-02

### ST-04 Extended
- Status: badge info "Extended to {due}"
- Banner: none
- Actions: Mark as answered (primary), Ask for proof of identity (tertiary) unless already asked
- Rules: BR-02, BR-05
- Goals: G-01, G-03

### ST-01 Open
- Status: badge info "Due on {due}"
- Banner: none
- Actions: Mark as answered (primary), Extend (secondary), Ask for proof of identity (tertiary) unless already asked
- Rules: BR-01, BR-02, BR-05, BR-06
- Goals: G-01

## Dialogs

A dialog opens over a state, from one of its buttons, and leaves that state as it is: its status and banner stay. It shows only over the states it lists, and only while the state under it still offers the button that opens it. When time moves the request to a state it does not list, or the request is extended, asked or answered somewhere else, the dialog closes and nothing it asked for is done.

### DL-01 Extend
- Opens from: Extend
- Over: ST-01, ST-02, ST-05, ST-08
- Title: "Extend the due date by two months"
- Asks: "Why it needs more time: the request is complex, or there are many requests. For the letter to the person"
- Actions: Extend (primary, disabled until written), Cancel (tertiary)
- Closes when: the due date passes, or the request is extended or answered in another tab. Nothing is extended.
- Rules: BR-02
- Goals: G-01

### DL-02 Ask for proof of identity
- Opens from: Ask for proof of identity
- Over: ST-01, ST-02, ST-04
- Title: "Ask for proof of identity"
- Asks: "Your doubt about who wrote"
- Actions: Ask (primary, disabled until written), Cancel (tertiary)
- Closes when: the due date passes, or proof is asked for or the request answered in another tab. Nothing is asked.
- Rules: BR-05
- Goals: G-01

### DL-03 Mark as answered
- Opens from: Mark as answered
- Over: ST-01, ST-02, ST-03, ST-04, ST-05, ST-08, ST-09
- Title: "Mark as answered"
- Asks: "Date the answer was sent"
- Actions: Mark as answered (primary, disabled until written), Cancel (tertiary)
- Closes when: the request is answered in the meantime, by someone else or in another tab. While it is not answered, answering is always possible.
- Rules: BR-04
- Goals: G-03

## Evals

Each row is one eval and one test. Viewer, Received, Sent on, Extended on, Proof asked on, Proof received on, Answered on, Dialog (the one the lead opened), Written (whether the lead has written in it: more than spaces) and Today are the facts. A main button marked "disabled until written" shows disabled when Written is a dash, and the checks test it. Due, State and Actions are what the screen must show: the buttons of the dialog when it shows, else those of the state. A dash means none.

| Eval | Viewer | Received | Sent on | Extended on | Proof asked on | Proof received on | Answered on | Dialog | Written | Today | Due | State | Actions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E-01 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | - | 2026-11-10 | 2026-12-03 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-02 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | - | 2026-11-28 | 2026-12-03 | ST-02 | Mark as answered, Extend, Ask for proof of identity |
| E-03 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | - | 2026-12-04 | 2026-12-03 | ST-03 | Mark as answered |
| E-04 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | - | - | 2026-11-25 | 2027-02-03 | ST-04 | Mark as answered, Ask for proof of identity |
| E-05 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | - | - | 2026-11-20 | 2026-12-03 | ST-05 | Proof received, Extend, Mark as answered |
| E-06 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-11-28 | - | - | 2026-12-10 | 2026-12-03 | ST-06 | - |
| E-07 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-01 | - | 2026-11-20 | 2026-12-03 | ST-01 | Extend, Cancel |
| E-08 | R-02 | 2026-11-03 | 2026-11-06 | - | - | - | - | - | - | 2026-11-20 | 2026-12-03 | ST-07 | - |
| E-09 | R-01 | 2026-01-31 | 2026-01-31 | - | - | - | - | - | - | 2026-02-10 | 2026-02-28 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-10 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | - | - | 2027-01-30 | 2027-02-03 | ST-02 | Mark as answered, Ask for proof of identity |
| E-11 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | - | - | 2027-02-05 | 2027-02-03 | ST-03 | Mark as answered |
| E-12 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | - | - | 2026-12-05 | 2026-12-03 | ST-09 | Proof received, Mark as answered |
| E-13 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | - | 2026-12-03 | 2026-12-03 | ST-02 | Mark as answered, Extend, Ask for proof of identity |
| E-14 | R-02 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-11-28 | - | - | 2026-12-10 | 2026-12-03 | ST-07 | - |
| E-16 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | - | - | 2026-11-28 | 2026-12-03 | ST-08 | Proof received, Extend, Mark as answered |
| E-17 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | 2026-11-25 | - | - | - | - | 2026-12-01 | 2027-02-03 | ST-05 | Proof received, Mark as answered |
| E-18 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | 2026-11-15 | - | - | - | 2026-11-20 | 2026-12-03 | ST-01 | Mark as answered, Extend |
| E-19 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-01 | - | 2026-12-04 | 2026-12-03 | ST-03 | Mark as answered |
| E-20 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-01 | - | 2026-11-28 | 2026-12-03 | ST-02 | Extend, Cancel |
| E-21 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | DL-01 | - | 2026-11-28 | 2026-12-03 | ST-08 | Extend, Cancel |
| E-22 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-12-05 | - | - | 2026-12-10 | 2026-12-03 | ST-10 | - |
| E-23 | R-02 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | - | 2026-12-05 | 2026-12-03 | ST-07 | - |
| E-24 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-03 | - | 2026-12-05 | 2026-12-03 | ST-03 | Mark as answered, Cancel |
| E-25 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | DL-03 | - | 2026-12-05 | 2026-12-03 | ST-09 | Mark as answered, Cancel |
| E-26 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-02 | - | 2026-11-20 | 2026-12-03 | ST-01 | Ask, Cancel |
| E-27 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | - | 2026-11-26 | 2026-12-03 | ST-02 | Mark as answered, Extend, Ask for proof of identity |
| E-28 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | - | 2026-11-25 | 2026-12-03 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-29 | R-01 | 2026-01-31 | 2026-01-31 | 2026-02-10 | - | - | - | - | - | 2026-02-20 | 2026-04-30 | ST-04 | Mark as answered, Ask for proof of identity |
| E-30 | R-01 | 2028-01-31 | 2028-01-31 | - | - | - | - | - | - | 2028-02-10 | 2028-02-29 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-35 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-01 | yes | 2026-11-20 | 2026-12-03 | ST-01 | Extend, Cancel |
| E-36 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-02 | - | 2026-12-04 | 2026-12-03 | ST-03 | Mark as answered |
| E-37 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | 2026-12-05 | - | - | - | 2026-12-06 | 2026-12-03 | ST-03 | Mark as answered |
| E-38 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-03 | yes | 2026-11-20 | 2026-12-03 | ST-01 | Mark as answered, Cancel |
| E-39 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-11-20 | DL-03 | yes | 2026-11-20 | 2026-12-03 | ST-06 | - |
| E-40 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | 2026-11-25 | - | - | DL-01 | yes | 2026-12-01 | 2027-02-03 | ST-05 | Proof received, Mark as answered |
| E-41 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | 2027-01-20 | - | - | - | - | 2027-01-30 | 2027-02-03 | ST-08 | Proof received, Mark as answered |
| E-42 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | 2027-01-20 | - | - | - | - | 2027-02-05 | 2027-02-03 | ST-09 | Proof received, Mark as answered |
| E-43 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | 2026-11-28 | - | - | 2026-12-10 | 2026-12-03 | ST-06 | - |
| E-44 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | DL-01 | - | 2026-12-05 | 2026-12-03 | ST-09 | Proof received, Mark as answered |
| E-45 | R-02 | 2026-11-03 | 2026-11-03 | 2026-11-20 | 2026-11-25 | - | - | - | - | 2026-12-01 | 2027-02-03 | ST-07 | - |
| E-46 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | 2026-11-15 | - | DL-02 | yes | 2026-11-20 | 2026-12-03 | ST-01 | Mark as answered, Extend |
| E-47 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-11-20 | DL-01 | yes | 2026-11-20 | 2026-12-03 | ST-06 | - |
| E-48 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-11-20 | DL-02 | yes | 2026-11-20 | 2026-12-03 | ST-06 | - |
| E-49 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | 2026-12-05 | - | - | 2026-12-10 | 2026-12-03 | ST-10 | - |
| E-50 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | 2026-11-15 | - | - | - | 2026-11-28 | 2026-12-03 | ST-02 | Mark as answered, Extend |
| E-51 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | 2026-11-12 | 2026-11-15 | - | - | - | 2026-11-25 | 2027-02-03 | ST-04 | Mark as answered |
| E-52 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | DL-02 | - | 2026-11-25 | 2027-02-03 | ST-04 | Ask, Cancel |
| E-53 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | DL-02 | yes | 2026-11-28 | 2026-12-03 | ST-02 | Ask, Cancel |
| E-54 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | DL-03 | - | 2026-11-20 | 2026-12-03 | ST-05 | Mark as answered, Cancel |
| E-55 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | DL-03 | yes | 2026-11-28 | 2026-12-03 | ST-08 | Mark as answered, Cancel |
| E-56 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | DL-03 | - | 2026-11-25 | 2027-02-03 | ST-04 | Mark as answered, Cancel |

Where two states are true at once:

- E-12: waiting for proof, and overdue. Overdue wins, and the screen still says proof was asked for and can record that it arrived. Proof received leads, and Mark as answered stays the least prominent until Q-05 is answered.
- E-16: waiting for proof, and due soon. The countdown shows and Extend stays (D-07).
- E-17: extended, then waiting for proof. Extend is gone: a request is extended once.
- E-41 and E-42: extended, waiting for proof, and due soon or overdue. The countdown or the overdue count shows, and Extend stays gone.
- E-18: proof asked for, then received. Ask for proof of identity is gone: proof is asked for once (D-10), and the history keeps both dates.
- E-43 and E-49: answered while proof was still awaited (Q-05). Answered wins, on time or late, and the history keeps the day proof was asked for.
- E-50 and E-51: proof received, then due soon or extended. Ask for proof of identity stays gone (D-10).
- E-22: answered after the due date. The screen says how late (D-08).
- E-14, E-23 and E-45: a support agent on an answered, an overdue, or an extended request waiting for proof. The agent sees who has it, and nothing else about it: no due date, no reasons, no history (BR-08).
- E-37: proof that arrives after the due date. The request stays overdue.

Dialogs over a state: E-07, E-20, E-21, E-24, E-25 and E-26 show a dialog over the state, which keeps its status and banner. E-19, E-36 and E-44 show Extend and Ask for proof closing when the due date passes. E-40 and E-46 show them closing when the request was extended, or proof asked for, in another tab: the state no longer offers the button. E-47 and E-48 show them closing when the request was answered in another tab. E-52 shows Ask for proof staying open over a request extended in the meantime: ST-04 still offers it. E-53 to E-56 show each dialog over the other states it lists. E-39 shows Mark as answered closing when someone else has answered the request in the meantime. E-35 and E-38 show the main button once something is written.

Dates at the edges: E-09 is the month-end eval (Q-02); E-29 extends it (Q-03); E-30 is a leap year. E-13 is the due date itself: still due, not yet overdue. E-27 and E-28 are 7 and 8 days before the due date: the first is due soon, the second is not. E-18 shows the screen once the proof has arrived. E-08 is sent on a later day than it was received: the due date still counts from the day it reached the shop (BR-01).

## Not covered

What this screen does not show yet. Each is a gap someone decided to leave, not one nobody saw.

- Who did each thing. History lists dates, not people (G-03 is met for dates only).
- What the lead sees when a dialog closes on its own, and what happens to the text they had written in it.
- Whether the proof of identity was enough, a day it arrived other than the day it is recorded, and undoing Proof received (Q-07).
- Whether a written doubt is reasonable. The dialog checks only that something is written (D-09).
- That the answer should go out before the due date when it can (PRIV-01, "without undue delay"). The screen shows the latest date.
- When an answer date was entered, and correcting or reopening an answered request.
- A sign, on an answered request, that identity was never confirmed (Q-05). The history keeps the day proof was asked for (E-43).
- Whether the person was told about the extension. The screen keeps the reason, not the date the letter went out (Q-04).
- A refused date in the Mark as answered dialog, with its words. The flow eval E-31 says what must happen.
