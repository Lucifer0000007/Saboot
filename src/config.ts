// Project facts shown in the footer. Same in every language. The footer label already says "Team".
export const TEAM_NAME = 'Overflow';
export const PROJECT = 'Saboot';
export const TRACK = 'AgriTech & Rural Transformation · Agri-FinTech';
export const EVENT = 'Code Yudh Hackathon, Chandigarh University';
/** Where the code lives: a link a person can follow, never fetched by the page. scripts/budgets.mjs names it as the one outside address allowed. */
export const REPO_URL = 'https://github.com/Lucifer0000007/Saboot';

// The one place the public address lives. The build writes it into the canonical link and the Open Graph /
// Twitter tags (scripts/postbuild.mjs); `npm run qr` encodes it. Change it here when the site moves.
export const PUBLIC_URL = 'https://moonlit-pixie-248afc.netlify.app';
/** Appended to PUBLIC_URL for the judges' QR code: opens the simulation at the farmer's alert. */
export const QR_PATH = '?at=alert';

// ---------------------------------------------------------------------------------------------------------------
// Rails. Saboot is a disaster crop-loss evidence layer with two rails on one core (detection, capture, sealing,
// audit trail). Nothing here decides a claim, an eligibility or an amount: people decide, outside Saboot.
//   relief  primary: supports a state or district revenue assessment of flood losses (a girdawari-style process).
//           The officer ranks and verifies, the farmer supplies sealed evidence. No state is named in the app.
//   pmfby   second: supports the 72-hour intimation of a localized calamity, for a state that runs the scheme.
// ---------------------------------------------------------------------------------------------------------------
export type Rail = 'relief' | 'pmfby';
export const RAILS: readonly Rail[] = ['relief', 'pmfby'];
export const DEFAULT_RAIL: Rail = 'relief';

/**
 * Scenario parameters of the relief rail. Every value is a simulation setting, NOT an official figure, and is
 * labelled so wherever it is shown. No rupee amount exists anywhere in the product.
 */
export const RELIEF = {
  /**
   * Advice only, NOT a legal deadline: how long after the event the app nudges "capture soon", because photos of
   * standing water are most useful before the water recedes. This is Saboot's design assumption.
   */
  captureSoonHours: 48,
  // Source: MHA norms for SDRF/NDRF assistance: input subsidy for crop loss of 33% and above (earlier 50%), Lok Sabha
  // unstarred question 2488 (eparlib.nic.in). 0.33 here is a scenario parameter for ranking review work, not an amount rule.
  damageShareThreshold: 0.33,
  /** Not set on purpose: the product shows no per-acre amount. */
  perAcreAmount: null as number | null,
  /** Not set on purpose: the product applies no acreage cap. */
  acreageCapHa: null as number | null,
  /** Simulated: sim hour at which the officer publishes the draft list (outside Saboot), and how long objections stay open. */
  publishAtHour: 96,
  objectionWindowHours: 48,
};

/** Parameters of the PMFBY rail. */
export const PMFBY = {
  /** Hours from the event to the end of the localized-calamity intimation window. The claim itself is marked in src/i18n/en.ts. */
  windowHours: 72,
  // Source: Haryana notifies PMFBY each season (Kharif 2025 district notifications, Tribune, and Lok Sabha unstarred
  // question 2719, eparlib.sansad.in); not every state runs it.
  state: 'Haryana',
};

/** Hours from the event to the end of the capture window: a rule on the PMFBY rail, advice on the relief rail. */
export const railWindowHours = (rail: Rail): number => (rail === 'pmfby' ? PMFBY.windowHours : RELIEF.captureSoonHours);
/** True when passing the window has consequences (PMFBY). False when it is only a nudge (relief). */
export const railHardDeadline = (rail: Rail): boolean => rail === 'pmfby';
