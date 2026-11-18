# Misses

Mistakes that got past a gate and were found later. Each row says what was missed, which gate missed it, and what changed so it cannot get past again: a check when a script can see it, a question in the review when only a model can. Add a row the day a miss is found.

| Found on | What was missed | Gate that missed it | Found by | What changed |
|---|---|---|---|---|
| 2026-11-17 | D-07 let a request waiting for proof be extended for waiting alone, which is not a ground PRIV-02 gives. It came in with a fix from an earlier round. | Spec review: nine runs over three rounds | Spec review, round 7 (two runs of three) | D-07 now names the grounds PRIV-02 gives. None in the kit yet: a decision is checked against a rule only by reading. |
| 2026-11-18 | After an extension, step F-06 did not say where an extended request goes when it becomes due soon. | Spec check and spec review | A test of the review: ten known problems planted in a copy of the spec. Each of three runs found nine, and all three missed a step left out of Next. | New check SPEC-18: a step says where the request goes when time moves it on. It found the same gap in the example: F-06 now lands on ST-02 too. |
| 2026-11-18 | The handoff listed every decision under External rules as "D-01 (undefined, undefined): undefined". Feature decisions carry their file, as external rules do, and the script told them apart by the file. The handoff was also one step behind the flow. | The handoff check in CI, which compares the handoff with a fresh run of the same script, so a wrong script passes | A person reading the handoff | The script tells external rules apart by where they come from, and fails when any field comes out undefined. |
