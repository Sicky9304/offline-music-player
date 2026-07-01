import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App.jsx';
import './styles.css';

import { ThemeProvider }    from './hooks/useTheme.jsx';
import { SettingsProvider } from './hooks/useSettings.jsx';
import { LibraryProvider }  from './hooks/useLibrary.jsx';
import { PlayerProvider }   from './hooks/usePlayer.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <SettingsProvider>
          <LibraryProvider>
            <PlayerProvider>
              <App />
            </PlayerProvider>
          </LibraryProvider>
        </SettingsProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
