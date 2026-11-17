# The spec

This folder is everything the product knows that an agent cannot look up in the code: who the users are, the external rules, the product decisions, the business rules, and what each feature does. It is written once, and every way of making the product uses it: ideation, definition, testing and development. It says nothing about how a screen looks: the design system says that.

The spec has two levels.

- **The product**: what the whole product shares: its users, its rules and the decisions about the whole product. The files at the top of this folder, `sources/` and `personas/`.
- **The features**: what each feature does. `flows/`, one file per task, and `screens/`, one file per screen. A screen can sit in several flows.

Everything in this folder is an example for a made-up product: an inbox where a shop's privacy lead answers people's requests about their personal data, under the GDPR. Replace it with your own.

## The product level

| File | What it holds | IDs |
|---|---|---|
| `roles.md` | Who uses the product, what each role may see and do, and its persona sheet | R-01 |
| `personas/` | One persona sheet per role, from interviews: each trait with its source and how many interviews say it | none |
| `goals.md` | What each role comes to the product to get done | G-01 |
| `sources/` | The external rules: laws, regulator guidance, contracts, platform policies and standards, each with its source text. Written once, here. The synthetic user and the rules watch read them here | PRIV-01 |
| `decisions.md` | The product decisions that reach beyond one feature: choices the team made on purpose, with why, who decided, when, and the flows and screens they apply to (`product` for all) | D-01 |
| `decisions-replaced.md` | Decisions that are no longer true, each with the decision that replaced it. Nothing may cite them | D-01 |
| `rules.md` | The business rules: what the product does, each citing the external rules, decisions, goals or roles it comes from | BR-01 |
| `questions.md` | What nobody has answered yet, who will, what the product does meanwhile, and the flows and screens it applies to | Q-01 |
| `glossary.md` | What each thing in the product is today, in one line, and the decision behind it | none |

## The feature level

| Folder | What it holds | IDs |
|---|---|---|
| `flows/` | One file per task a role comes to do: what starts it, each step, who acts, the screen and state each step lands on, and evals for what no screen shows | F-01, E-01 |
| `screens/` | One file per screen: its states, and evals that say exactly which state and which actions each situation gets | ST-01, E-01 |

An ID never changes when the wording does. Everything that uses a rule, a goal or a state cites its ID: the code, the checks, the handoff and the reviews. A search for an ID finds everything to look at again when it changes. The checks hold the code to it: every rule a state applies must be named by ID in that screen's code.

The words a screen shows live here, in its states. Content that is not a screen, such as an article or an email template, lives outside the spec and cites the decisions and rules it follows, by ID.

## How a rule is written

One row per rule in `rules.md`:

| Column | What it holds |
|---|---|
| ID | BR- and a number |
| Rule | One rule, in plain words, that you can pass or fail |
| Sources | The external rules, decisions, goals or roles it comes from, by ID. A rule with no source is an opinion: it goes to `questions.md` first |
| Where | The screens that apply it |

## How a decision is written

Decisions live at two levels. A decision about the whole product, made for no single feature, is a row in `decisions.md`, the product decision log. Every decision made for a feature is a row in that feature's flow file, under `## Decisions`, its feature decision log, even when other features follow it too. It applies to that flow and its screens; an Applies to column, when the table has one, names any other flow or screen that follows it. So each decision sits beside the feature it was made for, and the product log stays short. IDs are shared across both levels: D-07 is one decision, wherever it lives, and any file can cite it.

| Column | What it holds |
|---|---|
| ID | D- and a number |
| Decision | The choice, in plain words |
| Why | The reason, and where it came from: user research, a market insight, the business strategy, a technical limit. A decision never goes against an external rule |
| Decided by | Who made it |
| Applies to | The flows and screens it touches, by file name, or `product` for the whole product |
| Date | When it was made |

Two features can decide differently. When a decision is no longer true, its row moves to `decisions-replaced.md`, with two more columns: the decision that replaced it and the date. The spec check then fails on anything that still cites the old one, so each place that followed it is looked at again.

A business rule cites the decisions it follows, by ID. When an open question is answered, the answer becomes a decision. An open question names the flows and screens it applies to: it may stay open inside one feature, but one that reaches further is answered before the change merges.

## When two states can be true at once

A screen lists its states in order, and when two could apply, the first one wins. That order is a decision, so it is never left to the order of a file. Every pair of states that can be true at the same time gets an eval that sets up both, and says which state wins and what it keeps from the other. Look for these pairs:

- **Time passes during another state**: the due date passes while the request waits for proof. A state that time brings in keeps the limits of the state it interrupts.
- **Who is looking**: a role with a narrower view of a state that is also late, or also blocked.
- **A dialog open when time moves on**: a dialog is not a state, so it never hides one (see "Dialogs" below). It needs an eval where the request moves to a state it does not open over, and the dialog closes.
- **A final state against time**: an answer sent after the due date. A final state keeps what happened before it, such as how late it was.
- **Events out of order**: proof that arrives after the due date; an action tried after it is no longer allowed.
- **Undo**: the state a request goes back to.
- **Two people at once**: two actions on the same thing.

The spec review lists every pair it finds with no eval.

## Dates and the words for them

Each date has one name, and one day it is. Two days that can differ, such as the day a request reached the shop and the day it was sent on, get two names and two facts. A date shows its year when it is not the current one, and the glossary says which time zone "today" is in. Boundaries get their own evals: the day a period starts and the day before, and a date at the end of a month.

## What a feature leaves out

A flow file and a screen file end with `## Not covered`: what the feature leaves out on purpose, each in one line, with the open question that holds it when there is one. A gap someone decided to leave is a decision; a gap nobody saw is a finding. The spec review reads the list, and does not report what is on it.

## When a feature is ready to merge

Each review can find something new, because each change gives it more to read. So a feature does not wait for a review that finds nothing. It merges when:

1. the spec check passes;
2. a review of the current version is in, run three times;
3. no finding two runs agree on goes against an external rule or a decision;
4. every other finding two runs agree on is fixed, written as an open question for an expert, listed under `## Not covered`, or written in the report as a follow-up for a later change.

A fix changes the feature, and so its spec hash: the review runs again on the fixed version. That run is the last one when none of its agreed findings goes against a rule or a decision: its other findings become follow-ups in its report, and the feature merges. A finding only one run made is a question for a person, not a fix.

## How a flow is written

A flow file describes one task, from the event that starts it to its end. It is written before the screens, because each step says which screen state it lands on.

At the top, four lines:

- **Trigger**: the event that starts the task.
- **Roles** and **Goals**: who does the task, and which goals it serves, by ID.
- **Ends**: what is true when the task is done.

Then a table, one row per step:

| Column | What it holds |
|---|---|
| Step | F- and a number |
| Who | The role that acts, by ID |
| What happens | The action, or the question for a choice |
| Screen | The screen file the step lands on, or `-` for a choice |
| States | The states of that screen the step can show, by ID |
| Dialog | The dialog the step opens on that screen, by ID, or `-` |
| Next | The steps that can come next, with the condition for each, or `end` |

An example row, from `flows/answer-a-request.md`:

```
| F-04 | R-01 | Writes the doubt, asks for proof of identity, and waits | request | ST-05, ST-08 | DL-02 | F-05 when the proof arrives, F-06 to extend while waiting, or F-08 when the due date passes |
```

The spec check reads the flow both ways: every step must land on a state and open a dialog that exist, and every state and every dialog must be reached by a step. A state no step reaches means a step is missing, or the state should not exist.

Some of what a flow does shows on no screen, such as a message the product must never send. It gets an eval under `## Evals`, in the flow file:

```
| Eval | Given | Then | Rules |
| E-15 | The privacy lead marks a request as answered, with the date the answer was sent | The product sends no email or message to the person, and records the date the lead entered | BR-04 |
```

Every business rule needs at least one eval, on a screen or in a flow. The handoff lists flow evals as acceptance tests for whoever builds the backend.

## How a screen is written

A screen file has four parts: a few lines about the whole screen, one section per state, one section per dialog, and a table of evals.

A state is one situation the screen can be in, such as "overdue" or "answered". For each state, the file says when it applies, what the screen shows and which buttons it offers. The table of evals then gives exact situations, with dates, and the state each one must get. The checks build the screen for each eval, so every eval is also a test.

An example, from `screens/request.md`:

```
# Screen: Request
- Template: detail-page              ← from the design system
- Roles: R-01, R-02
- Goals: G-01, G-02, G-03, G-04
- Never shows: €, fee, price          ← text that must not appear in any state
- Shows in every state: "Reached the shop on {received}", ...   ← text every state shows
- Shows when it happened: "Extended on {extended}", ...           ← a line that shows once its words have a value

## States
### ST-03 Overdue
- When: not answered, and today is after the due date
- Status: badge critical "Overdue by {overdue}"
- Banner: critical "This request is past its due date. ..."
- Actions: Mark as answered (primary)
- Rules: BR-03, BR-02
- Goals: G-01, G-02
```

- **When** says, in words, when the screen is in this state. The evals below make it exact.
- **Status** and **Banner** name a component of the design system, its variant and the words it shows. `none` means the state has none.
- **Actions** lists the buttons in order, each with its variant. A button that shows but cannot be used yet says `disabled`.
- **Says** lists words that must appear.
- **Never shows** lists words this state must not show, such as what another role may not see. `what happened` hides the screen's "Shows when it happened" lines. Every fact the screen records shows somewhere, or a state says it never shows it.
- **Rules** and **Goals** say why the state exists.
- **Built: not yet** marks a state the spec has merged and nobody has built yet. The same line under the screen's title marks the whole screen. The behaviour check and the design system check skip what is marked and list it on every run, and the handoff shows it. The pull request that builds it removes the line.

### Dialogs

A dialog is not a state. It opens over a state, from one of that state's buttons, and the state stays as it is under it: an overdue request still says "overdue" while the lead writes the date of the answer. So a dialog never hides what the state shows, and a state never has to repeat itself for each dialog. Write each dialog under `## Dialogs`:

```
### DL-01 Extend
- Opens from: Extend                       ← the button that opens it; the dialog shows only while that button is offered
- Over: ST-01, ST-02, ST-05, ST-08          ← the only states it shows over
- Title: "Extend the due date by two months"
- Asks: "Reason, for the letter to the person"
- Actions: Extend (primary, disabled until written), Cancel (tertiary)
- Closes when: the due date passes. Nothing is extended.
- Rules: BR-02
```

When time moves the request to a state the dialog does not list, the dialog closes and nothing it asked for is done. It also closes when the state stops offering its button: a request extended in another tab no longer offers Extend, so a second Extend dialog cannot go through. An action that can be done once says so on its button ("unless already extended"), and an eval opens its dialog after it was done. The flow step that opens it names it in its Dialog column. When something replaces the whole screen, such as a step of several pages, write it as a state instead: the choice is made per screen, in the spec, where everyone sees it.

### Evals

The evals table is the exact truth. Each row is one eval, with the facts that decide the state, and the state and actions the screen must show. Two columns are for dialogs: Dialog, the one the lead opened, and Written, whether they have written in it. When the dialog shows, Actions are its buttons. The checks build the screen from each row, so every row is also a test. Each dialog needs an eval that shows it, and one where it closes.

## Where the checks come in

| Gate | When | What it checks | Run |
|---|---|---|---|
| Spec check | Every change to the spec | What is missing or out of date: IDs, sources, every rule and goal used, every decision applies to a flow or screen that exists, every role has a persona sheet, every step of a flow lands on a state and opens a dialog that exist, every state and every dialog is reached, every dialog opens from a button the states under it offer, every state, dialog and rule covered by an eval, nothing cites a replaced decision, no open question reaches beyond one feature, every component named exists in the design system. It also lists external rules still "to confirm" past their "Check again on" date | `npm run spec` |
| Spec review | Before each merge | A synthetic user reads a feature's flow, screens and evals as each role, against the external rules and the persona sheets, and respects the decisions. Run three times; keep what two runs agree on. The report names the feature's spec hash, and the spec check fails until a report names the current one | [grounded-synthetic-user](https://github.com/nayyymarques-eng/grounded-synthetic-user) |
| Rules watch, optional | On a schedule, when the external rules change often, as in a regulated product | Reads the sources again, turns a changed rule back to "to confirm", and lists everything that depends on it | `.claude/agents/rules-watch.md` |
| Behaviour check | Every pull request that touches the screen | The built screen against every state and every eval, and every rule a state applies named in the screen's code | `npm run behaviour` |
| Design system check | Every pull request that touches the screen | How each state looks, with the design system's own harness | `npm run look` |

Two scripts check nothing, and help use the spec:

| Script | When | What it does | Run |
|---|---|---|---|
| Context | Before an agent builds, reviews or tests a feature | Prints the feature's part of the spec, following the IDs each state cites and each decision's and question's Applies to | `npm run context <flow or screen>` |
| Handoff | Every change to the spec | Writes the handoff from the spec, for whoever builds the backend | `npm run handoff` |

Run the checks on the result of the merge, not only on the branch: turn on GitHub's merge queue, or "Require branches to be up to date before merging". Two branches that each pass can still clash, such as two new decisions that both take D-07.

Who must approve a change to each part, such as legal for `sources/` and product for `decisions.md`, is set in `.github/CODEOWNERS`.
