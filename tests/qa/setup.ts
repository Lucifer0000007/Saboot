// Fresh output folders for each QA run.
import { rmSync, mkdirSync } from 'node:fs';

export default function setup() {
  rmSync('qa', { recursive: true, force: true });
  mkdirSync('qa/shots', { recursive: true });
  mkdirSync('qa/results', { recursive: true });
}
