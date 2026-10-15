# What already exists, and where Saboot fits

A neutral comparison. Saboot is meant to **complement** these channels, not replace any of them. Every statement about an
existing service is a claim to check, marked `{{VERIFY: ...}}` with where to check it. Nothing here is an endorsement, a
criticism or a claim that Saboot integrates with any of them: it does not.

## The channels

| Channel | What it is | Who uses it | What it does well | The gap Saboot addresses | Check |
|---|---|---|---|---|---|
| **The state's own loss assessment** (a girdawari-style survey of fields after a flood) | Revenue officials assess crop loss field by field and prepare lists used for relief. {{VERIFY: that state revenue departments run a field-by-field crop-loss assessment (girdawari or the state's equivalent) after floods and how it is triggered — the state revenue department manual or the order that triggered it}} | Revenue officers, patwaris, district administration. | It is the authority's own process, and it covers every field the officers can reach. | It starts after the water recedes, and officers must choose where to go first with limited staff. Saboot adds early, sealed photos and a ranked, explained worklist. It decides nothing. | State revenue department; for Punjab's special girdawari after floods, {{VERIFY: that Punjab ordered a special girdawari after the 2023 floods and how it was run — Punjab revenue department notifications and press releases}} |
| **The official Crop Insurance app and the insurance scheme's intimation process** | Farmers insured under the national crop-insurance scheme can report localized-calamity loss through an official app or channels, within a set time. {{VERIFY: that the official Crop Insurance app lets a farmer intimate loss from a localized calamity, and the time limit for doing so — pmfby.gov.in and the scheme's operational guidelines}} | Insured farmers, insurers, banks. | It is the official intimation route. | A farmer may not know the clock started, or what photos to take. Saboot's second rail prepares evidence and a pre-filled summary; **the farmer files through the official channel**. Not every state runs the scheme. | pmfby.gov.in; the state agriculture department |
| **The 14447 helpline** | A national helpline for crop-insurance intimation by phone. {{VERIFY: that the national crop-insurance helpline number is 14447, its languages and hours — pmfby.gov.in and agriwelfare.gov.in}} | Insured farmers without a smartphone. | A phone call needs no app. | A call records a report but not field evidence. Saboot's feature-phone path is a design simulation of a missed call and keypad, followed by a helper who records the photos. | agriwelfare.gov.in |
| **Bank and common-service-centre channels** | Banks and CSC operators help farmers with insurance and government services. {{VERIFY: what loss-intimation help bank branches and common service centres give farmers, and in which states — the lead bank and the state CSC coordinator}} | Farmers who already use the branch or the CSC. | Trusted, local, in person. | A helper can carry evidence capture. Saboot's helper mode gives them a queue, per-farmer consent and sealed evidence. | The state CSC coordinator; the lead bank |
| **Saboot** | A disaster crop-loss evidence layer: detection by rules, voice alerts, offline capture, sealed packets, a ranked worklist, a draft list, objection-ready evidence. | Officers (relief rail), farmers and helpers, later insurers (second rail). | Speed of the first signal; evidence that can be checked; uncertainty shown. | It does not decide, file, or integrate. Detection has not been validated on real data. | `docs/VALIDATION.md` |

## Two rails on one core

- **Relief (primary):** supports a state or district revenue assessment of flood losses. No state is named in the app, and no
  amount is shown. The "capture soon" window is advice, not a legal deadline.
- **Crop insurance (second):** supports the 72-hour intimation of a localized calamity in a state that runs the scheme
  {{VERIFY: the 72-hour intimation window for localized calamities and which perils it covers — the scheme's operational guidelines}}.
  The demonstration district is fictional and sits in Haryana {{VERIFY: that Haryana runs the national crop-insurance scheme — pmfby.gov.in and the Haryana agriculture department}}.

## How to use this table

Before any meeting, check each marked claim with the named source, replace the marker with the source and date you checked,
and delete anything that turns out wrong. Do not quote a row to a department or a farmer group before it is checked.
