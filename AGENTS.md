# Working with the spec

The spec says how the product behaves. The design system says how it looks. Read the spec before you build, review or test a screen, and never decide a behaviour the spec does not state.

## Where the work starts
Work starts from a trigger: a feature someone asks for, a rule that changes, or a problem someone found. Find or write the flow for it in `spec/flows/` first: the steps of the task, who acts, and the screen state each step lands on. Then write or change the screen states those steps need. Run `npm run spec` before you build anything.

## To add or change a flow
1. Run `npm run context <flow>` (or, for a new flow, for the screens it will land on), and read every decision that applies: the rows of `spec/decisions.md` whose "Applies to" names those flows or screens, or `product`, and the flow's own `## Decisions`.
2. Write the flow. If it goes against one of those decisions, stop and ask the person which it is: replace the decision (it moves to `spec/decisions-replaced.md`, and the spec check then names everything that still cites it), edit it, or add a decision for this feature, in its flow file. A decision made for another feature that does not name this one is not a contradiction: features can decide differently.
3. A question nobody can answer yet goes in `spec/questions.md`, with what the product does meanwhile and the flows and screens it applies to. If it reaches beyond this feature, the spec check fails until someone answers it, as a decision. A decision whose Status is `proposed` is not decided yet: treat it as an open question, and never set it to `decided` yourself; the person in its Decided by does.
4. Every decision made for this feature goes in its feature decision log: the flow file, under `## Decisions`. When another feature follows it too, an Applies to column names that feature. Only a decision about the whole product, made for no single feature, goes in `spec/decisions.md`.
5. For every pair of states that can be true at once, write an eval that sets up both and says which wins and what it keeps (`spec/README.md`, "When two states can be true at once"). On a screen with a decision table, the spec check lists these pairs for you.
6. Behaviour no screen shows, such as a message the product must never send, gets a flow eval under `## Evals` in the flow file. Every business rule needs at least one eval, on a screen or in a flow.
7. Write what the feature leaves out on purpose under `## Not covered`, in the flow and in each screen, with the open question that holds each gap.
8. A dialog is a layer over a state, not a state: write it under the screen's `## Dialogs`, with the states it opens over, and name it in the Dialog column of the step that opens it.

## Copy and content
The words a screen shows are part of the spec: each state's Status, Banner and Says, and each dialog's Title and Asks. Content that is not a screen, such as an article, an email template or a help page, lives outside the spec, and cites the decisions and rules it follows, by ID, so a search finds it when they change.

## To build or change a screen
1. Run `npm run context <flow or screen>` and read what it prints: the flows that land on the screen, the screen with its states and evals, and only the rules, decisions, open questions, external rules, goals, roles and persona sheets they cite or that name them. Read nothing else from `spec/` unless it points you there.
2. If the spec does not say what to do, stop and write the question in `spec/questions.md`. Do not guess a rule.
3. Put the behaviour in `src/<screen>.ts`: the due date, the state and the actions, each with the rule IDs it applies. Every rule a state applies must be named by ID in `src/<screen>.ts` or `screens/<screen>.tsx`, where the code applies it; the behaviour check fails on one that is not. The screen in `screens/<screen>.tsx` only shows it, and its root carries `data-state`. It also exports `fromExample` (an eval row to the screen's props) and `words` (the value of each {word} in the spec's Words table), so the checks can read any screen.
4. Build the screen with ai-ready-design-system, as its own `AGENTS.md` says.
5. Run `npm run check`. Fix every failure in the same pull request. A failure names the check, the eval and where to look.

## To change a behaviour
Change the spec first: the rule, the flow step if the task changes, the state, and at least one eval that shows the change. The spec can merge before the screen is built: mark each new state `- Built: not yet` (or the whole screen, under its title), and remove the mark in the pull request that builds it. Then run `npm run handoff`, so whoever builds the backend reads the new version. A decision gets a row, with why, who decided and the date: in the flow file under `## Decisions` when only this feature needs it, or in `spec/decisions.md`, with what it applies to, when other features share it.

## To review a spec
Read only `spec/`, starting from `npm run context <flow>` for the feature under review. Check each state against the rules and the goals it cites, each rule against its sources, and each feature against the persona sheets of the roles in its flow. Say which example is missing, which rule no state applies, and which word means two things. A review run once can miss things or invent them: run it three times, and keep the findings at least two runs agree on. A change that only rewords keeps the structure hash, and one run is enough: start its report with `Review: light`. The feature is ready to merge when `spec/README.md`, "When a feature is ready to merge", says so.
