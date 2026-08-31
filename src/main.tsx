import { createRoot } from 'react-dom/client';
import App from './App';
import { hydrate } from './store/store';
import './styles/tokens.css';
import './styles/app.css';

void hydrate().then(() => {
  const el = document.getElementById('root');
  if (!el) throw new Error('root missing');
  createRoot(el).render(<App />);
});
