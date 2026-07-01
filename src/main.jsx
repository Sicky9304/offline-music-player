import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App.jsx';
import './styles.css';

import { ThemeProvider }    from './hooks/useTheme.jsx';
import { SettingsProvider } from './hooks/useSettings.jsx';
import { LibraryProvider }  from './hooks/useLibrary.jsx';
import { PlayerProvider }   from './hooks/usePlayer.jsx';
import { MoodProvider }     from './hooks/useMood.jsx';
import { ProfileProvider }  from './hooks/useProfile.jsx';
import ErrorBoundary        from './components/ui/ErrorBoundary.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <SettingsProvider>
          <ProfileProvider>
            <MoodProvider>
              <LibraryProvider>
                <PlayerProvider>
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </PlayerProvider>
              </LibraryProvider>
            </MoodProvider>
          </ProfileProvider>
        </SettingsProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
