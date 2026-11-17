# Screen: Request

One request, opened from the privacy lead's list: the person's message, its due date, what to do next and what was done.

- Template: detail-page
- Roles: R-01, R-02
- Goals: G-01, G-02, G-03, G-04
- Never shows: €, fee, price

## Words

The words in braces come from the eval row. A date shows as "3 Dec", with the year when it is not Today's year: "3 Feb 2027".

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

## States

When two states could apply, the first one in this list wins. Every pair of states that can be true at once has an eval that says which one wins and what it keeps.

### ST-11 Answered late
- When: the privacy lead marked the request as answered, with a date after the due date
- Status: badge warning "Answered {late} late"
- Banner: none
- Actions: none
- Says: "Sent from the shop's email on {answered}, {late} after the due date"
- Rules: BR-04, BR-03
- Goals: G-01, G-03

### ST-06 Answered
- When: the privacy lead marked the request as answered, with a date on or before the due date
- Status: badge positive "Answered on {answered}"
- Banner: none
- Actions: none
- Says: "Sent from the shop's email on {answered}"
- Rules: BR-04
- Goals: G-01, G-03

### ST-08 Support agent's view
- When: a support agent opens a request that is not answered, overdue or not
- Status: badge none "With the privacy lead"
- Banner: none
- Actions: none
- Says: "Sent to the privacy lead on {sent}"
- Rules: BR-08
- Goals: G-04

### ST-12 Marking as answered, no date yet
- When: the privacy lead clicked Mark as answered and has not entered the date the answer was sent
- Status: badge info "Due on {due}"
- Banner: none
- Dialog: "Mark as answered"
- Actions: Mark as answered (primary, disabled), Cancel (tertiary)
- Says: "Date the answer was sent"
- Rules: BR-04
- Goals: G-03

### ST-10 Overdue, waiting for proof of identity
- When: not answered, today is after the due date, and the proof of identity asked for has not arrived
- Status: badge critical "Overdue by {overdue}"
- Banner: critical "This request is past its due date. You asked for proof of identity on {asked} and it has not arrived."
- Actions: Proof received (primary), Mark as answered (tertiary)
- Rules: BR-03, BR-05
- Goals: G-01, G-02

### ST-03 Overdue
- When: not answered, and today is after the due date. Any open dialog closes: Extend and Ask for proof are gone once the due date has passed.
- Status: badge critical "Overdue by {overdue}"
- Banner: critical "This request is past its due date. It stays at the top of your list until you mark it as answered."
- Actions: Mark as answered (primary)
- Rules: BR-03, BR-02
- Goals: G-01, G-02

### ST-07 Extending, no reason yet
- When: the privacy lead clicked Extend and has not written the reason
- Status: badge info "Due {in}"
- Banner: none
- Dialog: "Extend the due date by two months"
- Actions: Extend (primary, disabled), Cancel (tertiary)
- Says: "Reason, for the letter to the person"
- Rules: BR-02
- Goals: G-01

### ST-13 Asking for proof of identity, no doubt written yet
- When: the privacy lead clicked Ask for proof of identity and has not written the doubt
- Status: badge info "Due {in}"
- Banner: none
- Dialog: "Ask for proof of identity"
- Actions: Ask (primary, disabled), Cancel (tertiary)
- Says: "Your doubt about who wrote"
- Rules: BR-05
- Goals: G-01

### ST-09 Waiting for proof of identity, due soon
- When: the proof of identity asked for has not arrived, and the due date is 7 days away or less
- Status: badge warning "Due {in}"
- Banner: info "You asked for proof of identity on {asked}. Waiting does not move the due date."
- Actions: Proof received (primary), Extend (secondary) unless already extended, Mark as answered (tertiary)
- Rules: BR-05, BR-07, BR-02
- Goals: G-01, G-02

### ST-05 Waiting for proof of identity
- When: the proof of identity asked for has not arrived
- Status: badge none "Waiting for proof of identity"
- Banner: info "You asked for proof of identity on {asked}. Waiting does not move the due date: {due}."
- Actions: Proof received (primary), Extend (secondary) unless already extended, Mark as answered (tertiary)
- Rules: BR-05, BR-01, BR-02
- Goals: G-01

### ST-02 Due soon
- When: not answered, and the due date is 7 days away or less
- Status: badge warning "Due {in}"
- Banner: none
- Actions: Mark as answered (primary), Extend (secondary) unless already extended, Ask for proof of identity (tertiary)
- Rules: BR-07, BR-01, BR-02, BR-05
- Goals: G-01, G-02

### ST-04 Extended
- When: the privacy lead extended the due date, and it is more than 7 days away
- Status: badge info "Extended to {due}"
- Banner: none
- Actions: Mark as answered (primary), Ask for proof of identity (tertiary)
- Rules: BR-02
- Goals: G-01, G-03

### ST-01 Open
- When: none of the above
- Status: badge info "Due on {due}"
- Banner: none
- Actions: Mark as answered (primary), Extend (secondary), Ask for proof of identity (tertiary)
- Rules: BR-01, BR-02, BR-05, BR-06
- Goals: G-01

## Evals

Each row is one eval and one test. Viewer, Received, Sent on, Extended on, Proof asked on, Proof received on, Answered on, Dialog and Today are the facts. Due, State and Actions are what the screen must show. A dash means none.

| Eval | Viewer | Received | Sent on | Extended on | Proof asked on | Proof received on | Answered on | Dialog | Today | Due | State | Actions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E-01 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | 2026-11-10 | 2026-12-03 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-02 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | 2026-11-28 | 2026-12-03 | ST-02 | Mark as answered, Extend, Ask for proof of identity |
| E-03 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | 2026-12-04 | 2026-12-03 | ST-03 | Mark as answered |
| E-04 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | - | 2026-11-25 | 2027-02-03 | ST-04 | Mark as answered, Ask for proof of identity |
| E-05 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | - | 2026-11-20 | 2026-12-03 | ST-05 | Proof received, Extend, Mark as answered |
| E-06 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-11-28 | - | 2026-12-10 | 2026-12-03 | ST-06 | - |
| E-07 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | extend | 2026-11-20 | 2026-12-03 | ST-07 | Extend, Cancel |
| E-08 | R-02 | 2026-11-03 | 2026-11-06 | - | - | - | - | - | 2026-11-20 | 2026-12-03 | ST-08 | - |
| E-09 | R-01 | 2026-01-31 | 2026-01-31 | - | - | - | - | - | 2026-02-10 | 2026-02-28 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-10 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | - | 2027-01-30 | 2027-02-03 | ST-02 | Mark as answered, Ask for proof of identity |
| E-11 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | - | - | - | - | 2027-02-05 | 2027-02-03 | ST-03 | Mark as answered |
| E-12 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | - | 2026-12-05 | 2026-12-03 | ST-10 | Proof received, Mark as answered |
| E-13 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | 2026-12-03 | 2026-12-03 | ST-02 | Mark as answered, Extend, Ask for proof of identity |
| E-14 | R-02 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-11-28 | - | 2026-12-10 | 2026-12-03 | ST-06 | - |
| E-16 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | - | 2026-11-28 | 2026-12-03 | ST-09 | Proof received, Extend, Mark as answered |
| E-17 | R-01 | 2026-11-03 | 2026-11-03 | 2026-11-20 | 2026-11-25 | - | - | - | 2026-12-01 | 2027-02-03 | ST-05 | Proof received, Mark as answered |
| E-18 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | 2026-11-15 | - | - | 2026-11-20 | 2026-12-03 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-19 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | extend | 2026-12-04 | 2026-12-03 | ST-03 | Mark as answered |
| E-20 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | extend | 2026-11-28 | 2026-12-03 | ST-07 | Extend, Cancel |
| E-21 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | extend | 2026-11-20 | 2026-12-03 | ST-07 | Extend, Cancel |
| E-22 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | 2026-12-05 | - | 2026-12-10 | 2026-12-03 | ST-11 | - |
| E-23 | R-02 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | 2026-12-05 | 2026-12-03 | ST-08 | - |
| E-24 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | answer | 2026-12-05 | 2026-12-03 | ST-12 | Mark as answered, Cancel |
| E-25 | R-01 | 2026-11-03 | 2026-11-03 | - | 2026-11-12 | - | - | answer | 2026-11-20 | 2026-12-03 | ST-12 | Mark as answered, Cancel |
| E-26 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | proof | 2026-11-20 | 2026-12-03 | ST-13 | Ask, Cancel |
| E-27 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | 2026-11-26 | 2026-12-03 | ST-02 | Mark as answered, Extend, Ask for proof of identity |
| E-28 | R-01 | 2026-11-03 | 2026-11-03 | - | - | - | - | - | 2026-11-25 | 2026-12-03 | ST-01 | Mark as answered, Extend, Ask for proof of identity |
| E-29 | R-01 | 2026-01-31 | 2026-01-31 | 2026-02-10 | - | - | - | - | 2026-02-20 | 2026-04-30 | ST-04 | Mark as answered, Ask for proof of identity |
| E-30 | R-01 | 2028-01-31 | 2028-01-31 | - | - | - | - | - | 2028-02-10 | 2028-02-29 | ST-01 | Mark as answered, Extend, Ask for proof of identity |

Where two states are true at once:

- E-12: waiting for proof, and overdue. Overdue wins, and the screen still says proof was asked for and can record that it arrived.
- E-16: waiting for proof, and due soon. The countdown shows and Extend stays (D-07).
- E-17: extended, then waiting for proof. Extend is gone: a request is extended once.
- E-19: the Extend dialog open when the due date passes. Overdue wins and the dialog closes: Extend is refused once the due date has passed (BR-02).
- E-20 and E-21: the Extend dialog open on a request due soon, or waiting for proof. The dialog wins and its badge keeps the countdown.
- E-22: answered after the due date. The screen says how late (D-08).
- E-23: a support agent on an overdue request. The agent sees who has it, not that it is overdue (BR-08).
- E-24 and E-25: the Mark as answered dialog on an overdue request, or one waiting for proof. The dialog wins: answering is always possible.

Dates at the edges: E-09 is the month-end eval (Q-02); E-29 extends it (Q-03); E-30 is a leap year. E-13 is the due date itself: still due, not yet overdue. E-27 and E-28 are 7 and 8 days before the due date: the first is due soon, the second is not. E-18 shows the screen once the proof has arrived. E-08 is sent on a later day than it was received: the due date still counts from the day it reached the shop (BR-01).

## Not covered

What this screen does not show yet. Each is a gap someone decided to leave, not one nobody saw.

- Who did each thing. History lists dates, not people (G-03 is met for dates only).
- Correcting or reopening an answered request.
- Whether the person was told about the extension. The screen keeps the reason, not the date the letter went out (Q-04).
