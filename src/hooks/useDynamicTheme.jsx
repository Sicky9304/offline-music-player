import { useEffect, useRef } from 'react';
import { usePlayer } from './usePlayer.jsx';
import { useSettings } from './useSettings.jsx';
import { extractDominantColor, applyDynamicColor } from '../utils/colorExtractor.js';

/**
 * Watches the currently playing track's thumbnail and extracts the dominant color.
 * Smoothly updates CSS custom properties for dynamic theming.
 */
export function useDynamicTheme() {
  const { currentMedia } = usePlayer();
  const { settings } = useSettings();
  const prevThumbRef = useRef(null);

  useEffect(() => {
    if (!settings.dynamicTheme) return;
    
    const thumbnail = currentMedia?.thumbnail;
    if (!thumbnail || thumbnail === prevThumbRef.current) return;
    prevThumbRef.current = thumbnail;

    extractDominantColor(thumbnail).then(color => {
      applyDynamicColor(color);
    });
  }, [currentMedia?.thumbnail, settings.dynamicTheme]);
}
