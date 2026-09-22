import { createRoot } from 'react-dom/client';
import { localArea } from '../../storage/browser';
import { Options } from '../../ui/options/Options';
import '@fontsource-variable/atkinson-hyperlegible-next';
import '@fontsource-variable/atkinson-hyperlegible-mono';
import '../../ui/pages.css';

const container = document.getElementById('root');

if (container !== null) {
  createRoot(container).render(<Options settingsArea={localArea} historyArea={localArea} />);
}
