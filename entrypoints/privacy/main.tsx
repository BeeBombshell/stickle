import { render } from 'preact';
import PrivacyApp from './App';
import '../../styles/design-tokens.css';

const root = document.getElementById('app');
if (root) {
  render(<PrivacyApp />, root);
}
