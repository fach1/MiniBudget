// Theme Manager: handles dynamic color customization for header and sidebar
import { STORAGE_KEYS } from './constants.js';

const THEME_STORAGE_KEY = 'minibudgetTheme';

const PRESETS = {
  green: { primary: '#28a745' },
  blue: { primary: '#0d6efd' },
  purple: { primary: '#6f42c1' },
  dark: { primary: '#1f1f1f' }
};

function getLuminance(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function bestTextColor(bgHex) {
  const lum = getLuminance(bgHex);
  // Simple threshold: if luminance < 0.5 use white else dark
  return lum < 0.5 ? '#ffffff' : '#111111';
}

function applyTheme({ primary, text }) {
  const root = document.documentElement;
  if (primary) {
    const auto = bestTextColor(primary);
    root.style.setProperty('--header-bg', primary);
    root.style.setProperty('--sidebar-bg', primary);
    root.style.setProperty('--button-primary-bg', primary);
    root.style.setProperty('--header-text', text || auto);
    root.style.setProperty('--sidebar-text', text || auto);
    root.style.setProperty('--button-primary-text', text || auto);
  }
}

function loadStoredTheme() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    applyTheme(obj);
    return obj;
  } catch (e) {
    console.error('Error loading theme', e);
    return null;
  }
}

function saveTheme(themeObj) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeObj));
  } catch (e) {
    console.error('Error saving theme', e);
  }
}

export function createThemeManager() {
  let currentTheme = { primary: getComputedStyle(document.documentElement).getPropertyValue('--header-bg').trim() || '#28a745', text: '#ffffff' };

  function init() {
    const stored = loadStoredTheme();
    if (stored) currentTheme = stored;
    const primaryInput = document.getElementById('theme-primary-color');
    if (primaryInput) primaryInput.value = rgbToHex(currentTheme.primary || '#28a745');
    attachEvents();
  }

  function attachEvents() {
    const primaryInput = document.getElementById('theme-primary-color');
    const resetBtn = document.getElementById('reset-theme');
    const presetButtons = document.querySelectorAll('.preset-theme-btn');
    if (primaryInput) {
      primaryInput.addEventListener('input', () => {
        currentTheme.primary = primaryInput.value;
        currentTheme.text = undefined;
        applyTheme(currentTheme);
        saveTheme(currentTheme);
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentTheme = { primary: '#28a745', text: '#ffffff' };
        applyTheme(currentTheme);
        saveTheme(currentTheme);
        if (primaryInput) primaryInput.value = '#28a745';
      });
    }
    if (presetButtons) {
      presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = PRESETS[btn.dataset.preset];
          if (preset) {
            currentTheme = { ...preset };
            applyTheme(currentTheme);
            saveTheme(currentTheme);
            if (primaryInput) primaryInput.value = preset.primary;
          }
        });
      });
    }
  }

  return { init, applyTheme };
}

// Utility: convert rgb(…) from computed style to hex
function rgbToHex(color) {
  if (!color) return '#000000';
  if (color.startsWith('#')) return color;
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!rgbMatch) return '#000000';
  const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}
