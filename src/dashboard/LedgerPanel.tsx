// Lazy chunk for the Ledger tab of the simulation panel.
import '../styles/console.css';
import { MapDefs } from './DistrictMap';
import { Ledger } from './Ledger';

export default function LedgerPanel() {
  return (
    <section class="page dash embedded" aria-labelledby="ledger-h">
      <MapDefs />
      <h2 id="ledger-h" class="sr-only">Audit ledger</h2>
      <Ledger />
    </section>
  );
}
