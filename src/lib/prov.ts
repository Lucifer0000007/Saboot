// Where a value on screen comes from. Every input or observation value (a location, a capture time, a typed reading, a
// registration, a note, a photo, a rain or river reading) carries one of these, so a value cannot be shown without saying
// what it is (docs/FEATURE-MAP.md, "HAND design"). Derived numbers (scores, counts) inherit through the label of their region.
//   live    this phone, now: the real camera, GPS and clock
//   replay  real past data, run offline and named by its source
//   sim     the synthetic district and its scripted people
//   hand    typed or chosen by a person (who entered it is shown when known)
export type Prov = 'live' | 'replay' | 'sim' | 'hand';
/** A packet from before the origin bits existed says nothing about where its parts came from. */
export type ProvOrDash = Prov | 'unrecorded';

export const PROVS: readonly Prov[] = ['live', 'replay', 'sim', 'hand'];
export const isProv = (x: unknown): x is ProvOrDash => x === 'unrecorded' || PROVS.includes(x as Prov);

/** The packet's own words (live, sim, hand, or nothing) as a label. */
export const fromOrigin = (o: 'live' | 'sim' | 'hand' | undefined): ProvOrDash => o ?? 'unrecorded';
