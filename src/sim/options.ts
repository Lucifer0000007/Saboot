// Model options for a rail and a radar cadence. Kept apart from model.ts so the model has one small import of the
// rail configuration, and callers (the app, the generator, the tests) build options the same way.
import { DEFAULT_RAIL, RELIEF, railWindowHours, type Rail } from '../config';
import type { Cadence, ModelOptions } from './model';

/** Options for a rail: the capture window is a rule on the PMFBY rail and advice on the relief rail. */
export const modelOptions = (rail: Rail = DEFAULT_RAIL, cadence: Cadence = 'demo'): ModelOptions => ({
  rail,
  windowHours: railWindowHours(rail),
  cadence,
  publishAtHour: RELIEF.publishAtHour,
  objectionWindowHours: RELIEF.objectionWindowHours,
});
