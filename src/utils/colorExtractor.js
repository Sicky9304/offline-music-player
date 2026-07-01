// ─── Album Art Dominant Color Extractor ───────────────────────────────────────
// Uses an offscreen canvas to sample pixels and extract the dominant color

/**
 * Extract the dominant color from an image source (URL or data URI).
 * Returns an object: { r, g, b, hex, hsl, isDark }
 */
export function extractDominantColor(imageSrc) {
  return new Promise((resolve) => {
    const fallback = { r: 124, g: 58, b: 237, hex: '#7c3aed', hsl: '263, 70%, 57%', isDark: true };
    if (!imageSrc) return resolve(fallback);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 64; // Sample at low resolution for performance
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const data = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets = {};
        
        // Sample every 4th pixel for speed
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          if (a < 128) continue; // Skip transparent pixels
          
          // Skip very dark and very light pixels (backgrounds)
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 230) continue;
          
          // Quantize to reduce color space
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          
          // Weight by saturation (prefer vibrant colors)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const weight = 1 + saturation * 3;
          
          colorBuckets[key] = (colorBuckets[key] || 0) + weight;
        }

        // Find the most prominent color
        let dominant = null;
        let maxCount = 0;
        for (const [key, count] of Object.entries(colorBuckets)) {
          if (count > maxCount) {
            maxCount = count;
            dominant = key;
          }
        }

        if (!dominant) return resolve(fallback);

        const [r, g, b] = dominant.split(',').map(Number);
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        const isDark = (r * 0.299 + g * 0.587 + b * 0.114) < 128;

        resolve({ r, g, b, hex, hsl, isDark });
      } catch {
        resolve(fallback);
      }
    };

    img.onerror = () => resolve(fallback);
    img.src = imageSrc;
  });
}

/**
 * Apply extracted color as CSS custom properties with smooth transition
 */
export function applyDynamicColor(color) {
  const root = document.documentElement;
  root.style.setProperty('--dynamic-bg', color.hex);
  root.style.setProperty('--dynamic-glow', color.hex);
  root.style.setProperty('--dynamic-accent', color.hex);
}

/**
 * Generate a complementary palette from a base color
 */
export function generatePalette(hex) {
  const [h, s, l] = hexToHsl(hex);
  return {
    primary: hex,
    light: hslToHex(h, Math.max(s - 10, 0), Math.min(l + 20, 95)),
    dark: hslToHex(h, Math.min(s + 10, 100), Math.max(l - 20, 5)),
    glow: `rgba(${hexToRgb(hex).join(',')}, 0.3)`,
    gradient: `linear-gradient(135deg, ${hslToHex(h, s, l)}, ${hslToHex((h + 30) % 360, s, l)})`,
  };
}

// ─── Color Conversion Helpers ─────────────────────────────────────────────────

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
