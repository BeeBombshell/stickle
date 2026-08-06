import '../../lib/posthog';
import { render } from 'preact';
import WaitlistApp from './App';
import '../../styles/design-tokens.css';

const root = document.getElementById('app');
if (root) {
  render(<WaitlistApp />, root);
}
