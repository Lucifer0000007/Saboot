// Page-level actions shared by the hero, nav, presenter keys and deep links.
import { t, playing, play, model } from '../sim/engine';
import { simTab, scrollToId } from './layout';

/** "Run the simulation": go to the simulation, show the farmer, and start the replay if it is at T+0. */
export function runSimulation() {
  simTab.value = 'farmer';
  scrollToId('simulation');
  if (model.value && !playing.value && t.value === 0) play();
}
