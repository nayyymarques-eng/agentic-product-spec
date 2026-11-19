# Spec review, with a synthetic user

Before a change merges into the spec, a synthetic user reads the feature as each role: its flow, its screens and their evals. It checks them against the external rules in `spec/sources/` and the persona sheets in `spec/personas/`, and it respects the decisions in `spec/decisions.md`. It is the second gate, after `npm run spec`: the spec check finds what is missing, and the synthetic user finds what is wrong.

The synthetic user comes from [grounded-synthetic-user](https://github.com/nayyymarques-eng/grounded-synthetic-user). It keeps no rules or persona sheets of its own: it reads them from this spec. To run it:

1. Install that kit in this project, as its README says. Its hook lets the agent read `spec/` and nothing else of the project.
2. Ask Claude Code: "Use the synthetic-user agent to review spec/flows/answer-a-request.md as privacy lead, in a spec review." Then: "Use the verifier on that report."

Give every run the same brief: product and feature rules (`rules.md`, Level) hold everywhere, so a screen that does not repeat one is not a finding. Report only what would block a build or hurt the user: a contradiction, a state with nothing defined, privacy, safety or consent. An edge case an inherited rule already answers goes under "Dropped", with the rule's ID.

### When a finding becomes an open question

A finding becomes an open question in `spec/questions.md` only if it passes all three tests:

- **(a) Nothing answers it.** No rule or decision answers it, and the report names the rules and decisions it checked.
- **(b) A builder would have to guess.** And the guess changes what the user sees, their privacy or their safety.
- **(c) It is new.** It is not a question already answered in other words: compare it with `decisions-replaced.md` and with the decisions that were once questions.

Every other finding goes under "Dropped" in the report, with the test it failed (a, b or c) and, for (a), the rule or decision that answers it. A round where no finding passes the three tests means the feature is ready to build (`spec/README.md`, "When a feature is ready to merge").

For example, in a review of `answer-a-request`:

```
## Dropped
- Can the privacy lead extend a request a second time? Fails (a): BR-02 says the due date is extended once.

## Open questions
- When the privacy lead leaves the shop, who sees their open requests and the due dates?
  (a) Checked R-01, R-02, BR-03, BR-08, D-02, Q-01 to Q-09 and the Not covered lists: none says.
  (b) A builder would have to guess who gets the requests; a wrong guess lets a due date pass with nobody seeing it.
  (c) No replaced decision or answered question covers it.
```

A model can miss a finding or invent one, and two runs of the same review differ. Run the review three times, and keep the findings at least two runs agree on (three is the minimum; a team can choose more, such as five runs and three agreeing); a finding only one run made is a question for a person, not a fix. A review rarely finds nothing, so the feature merges on the rule in `spec/README.md`, "When a feature is ready to merge", not on an empty report.

Each report names the spec hash and the structure hash of the feature it read, in two lines, `Spec hash: <hash>` and `Structure hash: <hash>`; `npm run context <flow>` prints both. The spec check fails until a report names the current spec hash, so every change to the flow or its screens needs a new review. A change that only rewords keeps the structure hash, and needs only a light review, run once: its report starts with the line `Review: light`. See `spec/README.md`, "How much review a change needs".

When a mistake gets past a gate and is found later, by a later review, a test or a person, it goes in `misses.md`: what was missed, which gate missed it, and what changed so it cannot get past again. A miss a script can see becomes a check. A miss only a model can see becomes a question in the review. A list of known problems planted in a copy of the spec tests the review itself: run it again when the review's instructions, the model or the kit change, and it must still find what it found before.

Reports go in this folder. The rules watch, which keeps the external rules current, is in `.claude/agents/rules-watch.md` and belongs to the spec: if the synthetic user's kit brings its own copy, use this one. The review of the example is in this folder.
