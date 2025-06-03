// Theme utility functions

export const THEMES = {
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  RED: 'red',
  INDIGO: 'indigo'
};

export const THEME_COLORS = {
  [THEMES.BLUE]: {
    name: 'Blue',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa'
  },
  [THEMES.GREEN]: {
    name: 'Green',
    primary: '#22c55e',
    primaryDark: '#16a34a',
    primaryLight: '#4ade80'
  },
  [THEMES.PURPLE]: {
    name: 'Purple',
    primary: '#a855f7',
    primaryDark: '#9333ea',
    primaryLight: '#c084fc'
  },
  [THEMES.RED]: {
    name: 'Red',
    primary: '#ef4444',
    primaryDark: '#dc2626',
    primaryLight: '#f87171'
  },
  [THEMES.INDIGO]: {
    name: 'Indigo',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8'
  }
};

// Apply theme to document
export const applyTheme = (theme) => {
  if (!theme || !Object.values(THEMES).includes(theme)) {
    theme = THEMES.BLUE; // Default fallback
  }
  
  // Set data-theme attribute on document element
  document.documentElement.setAttribute('data-theme', theme);
  
  // Store in localStorage for persistence
  localStorage.setItem('theme', theme);
  
  // Dispatch custom event for components that need to react to theme changes
  window.dispatchEvent(new CustomEvent('themeChanged', { 
    detail: { theme, colors: THEME_COLORS[theme] } 
  }));
  
  return theme;
};

// Get current theme
export const getCurrentTheme = () => {
  const stored = localStorage.getItem('theme');
  const current = document.documentElement.getAttribute('data-theme');
  
  return stored || current || THEMES.BLUE;
};

// Initialize theme on app load
export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || THEMES.BLUE;
  return applyTheme(savedTheme);
};

// Get theme colors for dynamic styling
export const getThemeColors = (theme) => {
  return THEME_COLORS[theme] || THEME_COLORS[THEMES.BLUE];
};

// Generate CSS custom properties for a theme
export const generateThemeCSS = (theme) => {
  const colors = getThemeColors(theme);
  return `
    --theme-primary: ${colors.primary};
    --theme-primary-dark: ${colors.primaryDark};
    --theme-primary-light: ${colors.primaryLight};
  `;
};

// Get theme-aware button classes
export const getThemedButtonClass = (variant = 'primary', theme = null) => {
  const currentTheme = theme || getCurrentTheme();
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
  
  const variants = {
    primary: `${baseClasses} text-white shadow-md hover:shadow-lg transform hover:scale-105`,
    secondary: `${baseClasses} bg-white border-2 text-gray-700 hover:text-gray-800 shadow-sm hover:shadow-md`,
    outline: `${baseClasses} bg-transparent border-2 shadow-sm hover:shadow-md`
  };
  
  return variants[variant] || variants.primary;
};

// Get theme-aware input classes
export const getThemedInputClass = () => {
  return 'border-2 border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md filter-input';
};

// Get theme-aware card classes
export const getThemedCardClass = () => {
  return 'bg-white rounded-xl shadow-lg p-6 border border-gray-100 backdrop-blur-sm bg-white/95 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 card';
};

// Update chart colors based on theme
export const getThemedChartColors = (theme = null) => {
  const currentTheme = theme || getCurrentTheme();
  const colors = getThemeColors(currentTheme);
  
  return {
    primary: colors.primary,
    primaryWithAlpha: colors.primary + '80', // 50% opacity
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    gradient: [colors.primaryLight, colors.primary, colors.primaryDark]
  };
};

// Theme-aware status colors (these remain consistent across themes)
export const getStatusColors = () => {
  return {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    pending: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
    suspended: '#6b7280'
  };
};

// Get theme-aware admin panel colors
export const getAdminPanelColors = (theme = null) => {
  const currentTheme = theme || getCurrentTheme();
  const colors = getThemeColors(currentTheme);
  
  return {
    headerGradient: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
    tabActive: colors.primary,
    tabHover: colors.primaryLight + '20', // 12% opacity
    buttonPrimary: colors.primary,
    buttonPrimaryHover: colors.primaryDark,
    accent: colors.primaryLight
  };
};

// Validate theme
export const isValidTheme = (theme) => {
  return Object.values(THEMES).includes(theme);
};

// Get all available themes for UI
export const getAvailableThemes = () => {
  return Object.entries(THEMES).map(([key, value]) => ({
    key,
    value,
    name: THEME_COLORS[value].name,
    colors: THEME_COLORS[value]
  }));
};

// Theme event listeners
export const addThemeChangeListener = (callback) => {
  window.addEventListener('themeChanged', callback);
  return () => window.removeEventListener('themeChanged', callback);
};

// Auto-detect system theme preference (optional enhancement)
export const getSystemThemePreference = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEMES.INDIGO; // Use indigo for dark preference
  }
  return THEMES.BLUE; // Default for light preference
};

// Initialize theme with system preference fallback
export const initializeThemeWithSystemPreference = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && isValidTheme(savedTheme)) {
    return applyTheme(savedTheme);
  }
  
  const systemTheme = getSystemThemePreference();
  return applyTheme(systemTheme);
};
