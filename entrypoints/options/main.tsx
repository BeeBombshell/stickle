import '../../lib/posthog';
import { render } from 'preact';
import { OptionsApp } from './OptionsApp';
import '../../styles/design-tokens.css';

const appEl = document.getElementById('app');
if (appEl) {
  render(<OptionsApp />, appEl);
}
