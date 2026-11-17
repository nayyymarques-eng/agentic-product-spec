# Spec review, with a synthetic user

Before a change merges into the spec, a synthetic user reads the feature as each role: its flow, its screens and their evals. It checks them against the external rules in `spec/sources/` and the persona sheets in `spec/personas/`, and it respects the decisions in `spec/decisions.md`. It is the second gate, after `npm run spec`: the spec check finds what is missing, and the synthetic user finds what is wrong.

The synthetic user comes from [grounded-synthetic-user](https://github.com/nayyymarques-eng/grounded-synthetic-user). It keeps no rules or persona sheets of its own: it reads them from this spec. To run it:

1. Install that kit in this project, as its README says. Its hook lets the agent read `spec/` and nothing else of the project.
2. Ask Claude Code: "Use the synthetic-user agent to review spec/flows/answer-a-request.md as privacy lead, in a spec review." Then: "Use the verifier on that report."

A model can miss a finding or invent one, and two runs of the same review differ. Run the review three times, and keep the findings at least two runs agree on (three is the minimum; a team can choose more, such as five runs and three agreeing); a finding only one run made is a question for a person, not a fix. A review rarely finds nothing, so the feature merges on the rule in `spec/README.md`, "When a feature is ready to merge", not on an empty report.

Each report names the spec hash and the structure hash of the feature it read, in two lines, `Spec hash: <hash>` and `Structure hash: <hash>`; `npm run context <flow>` prints both. The spec check fails until a report names the current spec hash, so every change to the flow or its screens needs a new review. A change that only rewords keeps the structure hash, and needs only a light review, run once: its report starts with the line `Review: light`. See `spec/README.md`, "How much review a change needs".

Reports go in this folder. The rules watch, which keeps the external rules current, is in `.claude/agents/rules-watch.md` and belongs to the spec: if the synthetic user's kit brings its own copy, use this one. The review of the example is in this folder.
