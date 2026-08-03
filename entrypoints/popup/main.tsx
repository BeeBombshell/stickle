import { render } from 'preact';
import { App } from './App';
import '../../styles/design-tokens.css';

const appEl = document.getElementById('app');
if (appEl) {
  render(<App />, appEl);
}
