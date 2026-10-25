# Pilot plan (a proposal to agree, not a promise)

Everything here is a **proposal**. Items in `[TO FILL]` are decisions for the buyer, not facts. Real-world statements carry a
`{{VERIFY: ...}}` marker until someone has checked them. There are **no projections, market sizes or user counts** in this
document, because there are none to give: Saboot has only ever run as a simulation.

## What the pilot is for

To find out, with real floods and real officers, whether a disaster crop-loss evidence layer helps a revenue or
disaster-management office assess faster and with better evidence, without taking any decision away from people. It is **not**
a test of a claims product and it does not touch compensation. Saboot assembles evidence and ranks review work. Officers
decide, outside Saboot.

## Phase 0: an evidence-only pilot that needs no department data

The full design below needs a department's plot register, gauge data and a comparison block. A smaller first step needs none
of that, because the evidence half of Saboot already runs on an ordinary phone today:

| Works today (tested) | Needs building first | Needs a person to agree |
|---|---|---|
| Guided capture of three photos, offline; per-farmer consent; helper mode for several farmers; sealing; the QR, code or link to the officer's laptop; the tamper check with no server | Starting the clock by hand when a helper hears a flood warning, labelled HAND (the HAND trust rule is built and tested; the button is not) | A helper (a CSC operator or sarpanch) to capture, and one patwari or officer willing to open the sealed codes on a laptop |

What it would show: whether helpers can capture sealed evidence for farmers during a real flood, and whether an officer accepts
a sealed code as a usable record. What it cannot show: detection, timing against a department's own list, or any effect on
assessment. The roles such a pilot needs are the roles in `docs/INTERVIEWS.md` (a patwari, a CSC operator, farmers); **none of
them has agreed to host one**, and no Haryana conversation has happened yet. Where and with whom: **[TO FILL]**.

## Design: one block against a comparison block

| | Pilot block | Comparison block |
|---|---|---|
| Where | One revenue block (or equivalent unit): **[TO FILL]**. | A second block the department judges similar in flood exposure, crops and size: **[TO FILL]**. |
| What happens | The department's usual assessment, **plus** Saboot's alerts, helper capture, worklist and draft list. | The department's usual assessment only. Same measurements taken the same way. |
| Why | To compare like with like in the same season and weather. | To tell the effect of Saboot from the effect of an easy or hard flood. |

Which blocks, how many villages and plots, and how many helpers: **[TO FILL]** with the department. No sample size is claimed.
If only one flood event happens, say so in the result: one event cannot separate Saboot from luck.

## What is measured

Every measure has one definition, used the same way in both blocks. The app's *Pilot metrics (simulated)* panel computes the
first three on the replay, with the same definitions, so a reader can see what a real number would mean.

| # | Measure | Definition | Where the data comes from | Who collects it |
|---|---|---|---|---|
| 1 | Time from event to assessed list | Hours from the start of the event (the first qualifying signal in the pilot block, the department's own event date in the comparison block) to the day the village-level assessed list is published. | Event log; the department's publication record. | Saboot team and the department's nodal officer. |
| 2 | Share of affected plots with evidence on file | Plots with sealed evidence received, divided by plots the department's own process later confirms as affected. | Saboot's log; the confirmed list. | Saboot team, checked by the department. |
| 3 | Objection rate | Objections filed, divided by entries on the published list. | The department's objection register; Saboot's attached-evidence log. | The department. |
| 4 | Officer-hours per village | Hours the assessing staff spend per village, from first visit to final list, using one time diary in both blocks. | Time diaries. | The department's officers, with a short form. |

Also tracked, to understand the four: false alarms (alerts the farmer answers "no damage" to), time from alert to photos, the
share of evidence captured by a helper, drop-off at each step, capture failures and offline waits, consent completed, and how
many officers used the worklist.

## Before the season: baseline

- Collect the same four measures for the last one or two floods in both blocks, from the department's records: **[TO FILL]**.
- Run `npm run validate:real` on those past events with the department's confirmed lists, and report the result **with its
  limits** (village level, rain and river rules only). This checks detection, not outcomes. See `docs/VALIDATION.md`.
- Interview officers, helpers and farmers with `docs/STAKEHOLDER-INTERVIEW-GUIDE.md`.

## What the buyer provides

- A plot register for the pilot villages (plot or khasra numbers with an approximate location), and village boundaries: **[TO FILL]**.
- Access to rain gauge data and river or dam gauge data they already use, with their danger levels: **[TO FILL]**.
- The existing assessment process, forms and timelines, and the person who owns each step.
- Named officers, patwaris and helpers, and a nodal officer who can approve changes.
- Past assessed lists for the baseline and the check above.
- A decision on data protection: who is responsible for the data, retention, and the language of consent. See
  `docs/PRIVACY-AND-CONSENT.md`.

## Roles

| Role | Who | Does |
|---|---|---|
| Department lead | **[TO FILL]** | Owns the process; approves lists and every decision. |
| Field officers and patwaris | **[TO FILL]** | Use the worklist; verify in the field; publish the draft list through their own process. |
| Helpers | Sarpanch, CSC operator, cooperative or extension worker: **[TO FILL]** | Capture for farmers who cannot, with each farmer's own consent. |
| Saboot team | **[TO FILL]** | Runs alerts, support and the measurements; never decides. |
| Independent reviewer | **[TO FILL]** | Checks the measures and the final write-up. |

## Consent and ethics

Each farmer a helper captures for gives their own consent, recorded in that farmer's own log. Farmers may say no, ask for a
copy, or ask for deletion at any time. No one is penalised for not taking part. Wording in the farmer's language is reviewed by
a native speaker and by counsel before use. The consent text and data handling are in `docs/PRIVACY-AND-CONSENT.md`, which is
**not legally reviewed**.

## Risks, and what we will watch

| Risk | What we do |
|---|---|
| **Alert fatigue.** Too many false alarms, and people stop answering. | Track false alarms as a first-class measure from week one. The thresholds are uncalibrated scenario parameters: review them with the department before the season. A stop condition below. |
| **False alarms and misses.** The rules can miss floods under tall crops and cannot tell flood from irrigation on paddy. | Show uncertainty everywhere. Record every miss. The farmer can always report on their own. |
| **Connectivity.** Weak or no signal at the field. | Capture works offline and queues. Measure offline waits. |
| **Helpers are not available**, or one helper serves too many farmers. | Track the share of evidence captured by helpers and the queue length. |
| **A tier is read as a decision.** | Training says "ranks review work". Count any case where a Saboot output was treated as a decision: that is a failure condition. |
| **Data protection.** | Data minimised; no names in exports; deletion on request; incident procedure agreed beforehand: **[TO FILL]**. |
| **Trust.** Farmers or officers distrust a new channel. | Start with officers' own worklist; keep farmers' official channels unchanged. |
| **The official process changes mid-pilot.** | Record the change and its date; report it with the result. |

## Week-by-week outline

The flood season, and so the live window, is outside anyone's control. The outline is a template to adapt: **[TO FILL]**.

| Weeks | Work |
|---|---|
| 1 to 2 | Agree scope, blocks, measures, consent wording, stop conditions and the success and failure definitions below. Sign the data agreement. |
| 3 to 4 | Load the plot register and village boundaries; connect rain and river data; run the validation harness on past events; training for officers and helpers. |
| 5 to 6 | Baseline measurements in both blocks. Dry run with a simulated alert. Fix what breaks. |
| 7 onwards, through the flood season | Live monitoring. Weekly review of false alarms, captures, drop-offs and support requests. The officers use the worklist; the department publishes lists through its own process. |
| After the last event | Collect the four measures; compare blocks; interviews; write the result with limits. |
| Final week | Review with the department and the independent reviewer. Decide: stop, adjust, extend. |

## Success and failure, agreed in advance

Both sides sign these numbers **before** the season. They are blanks on purpose.

**Success needs all of:**

1. Median time from event to assessed list is shorter in the pilot block than the comparison block by at least **[TO FILL]**.
2. The share of affected plots with evidence on file is at least **[TO FILL]**.
3. The objection rate is no higher than **[TO FILL]**, or, if higher, officers judge the objections were better evidenced.
4. Officer-hours per village are no higher than in the comparison block.
5. The false-alarm share stays below **[TO FILL]** and officers say they kept reading the alerts.

**Failure, or a reason to stop, is any of:**

- A Saboot output is used as a decision about any claim, eligibility or amount.
- A privacy incident, or a farmer is disadvantaged for declining.
- The false-alarm share goes above **[TO FILL]** for **[TO FILL]** weeks.
- Officers stop using the worklist.

A result in between is reported as it is: "not shown", with the numbers and the limits.

## What the pilot will not claim

The pilot will **not** claim that detection is validated beyond the events measured, that it works in another state or crop, that it saves money, or that any figure here predicts another season.
Results are reported as measured, with the number of events and villages next to them.
