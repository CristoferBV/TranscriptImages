/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── Stitch Design Token Palette ──────────────────────────────────────
      colors: {
        // Background & Surface
        'app-bg':                  '#101415',
        'surface':                 '#101415',
        'surface-dim':             '#101415',
        'surface-container-lowest':'#0b0f10',
        'surface-container-low':   '#191c1e',
        'surface-container':       '#1d2022',
        'surface-container-high':  '#272a2c',
        'surface-container-highest':'#323537',
        'surface-bright':          '#363a3b',
        'surface-variant':         '#323537',
        // Primary (cyan)
        'primary':                 '#a5e7ff',
        'primary-fixed':           '#b6ebff',
        'primary-fixed-dim':       '#47d6ff',
        'primary-container':       '#00d2ff',
        'on-primary':              '#003543',
        'on-primary-fixed':        '#001f28',
        'on-primary-fixed-variant':'#004e60',
        'on-primary-container':    '#00566a',
        'inverse-primary':         '#00677f',
        // Secondary (purple)
        'secondary':               '#dcb8ff',
        'secondary-fixed':         '#efdbff',
        'secondary-fixed-dim':     '#dcb8ff',
        'secondary-container':     '#7701d0',
        'on-secondary':            '#480081',
        'on-secondary-fixed':      '#2c0051',
        'on-secondary-fixed-variant':'#6700b5',
        'on-secondary-container':  '#dcb7ff',
        // Tertiary (blue-grey)
        'tertiary':                '#cfddfb',
        'tertiary-fixed':          '#d6e3ff',
        'tertiary-fixed-dim':      '#b9c7e4',
        'tertiary-container':      '#b3c1de',
        'on-tertiary':             '#233148',
        'on-tertiary-fixed':       '#0d1c32',
        'on-tertiary-fixed-variant':'#39475f',
        'on-tertiary-container':   '#414f68',
        // On surface tokens
        'on-surface':              '#e0e3e5',
        'on-surface-variant':      '#bbc9cf',
        'on-background':           '#e0e3e5',
        'inverse-surface':         '#e0e3e5',
        'inverse-on-surface':      '#2d3133',
        // Outlines
        'outline':                 '#859399',
        'outline-variant':         '#3c494e',
        // Error
        'error':                   '#ffb4ab',
        'error-container':         '#93000a',
        'on-error':                '#690005',
        'on-error-container':      '#ffdad6',
        // Misc
        'surface-tint':            '#47d6ff',
      },

      // ── Border Radius ─────────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.5rem',
        sm:      '0.375rem',
        md:      '0.5rem',
        lg:      '0.75rem',
        xl:      '1rem',
        '2xl':   '1.25rem',
        '3xl':   '1.5rem',
        full:    '9999px',
      },

      // ── Spacing ───────────────────────────────────────────────────────────
      spacing: {
        'safe-area-bottom':  'env(safe-area-inset-bottom)',
        'xs':                '4px',
        'sm-token':          '12px',
        'md-token':          '24px',
        'lg-token':          '48px',
        'xl-token':          '80px',
        'gutter':            '24px',
        'margin-mobile':     '16px',
        'margin-desktop':    '64px',
        'xs':                '475px',
      },

      // ── Font Families ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },

      // ── Font Sizes (with line-height, tracking, weight) ───────────────────
      fontSize: {
        'display-lg':       ['64px',  { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg':      ['40px',  { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg-mob':  ['32px',  { lineHeight: '1.2',  fontWeight: '600' }],
        'headline-md':      ['28px',  { lineHeight: '1.3',  fontWeight: '600' }],
        'body-lg':          ['18px',  { lineHeight: '1.6',  fontWeight: '400' }],
        'body-md':          ['16px',  { lineHeight: '1.6',  fontWeight: '400' }],
        'label-md':         ['14px',  { lineHeight: '1.4',  letterSpacing: '0.05em', fontWeight: '500' }],
        'label-sm':         ['12px',  { lineHeight: '1.2',  fontWeight: '600' }],
      },

      // ── Box Shadows ───────────────────────────────────────────────────────
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(0,210,255,0.35)',
        'glow-purple': '0 0 20px rgba(220,184,255,0.25)',
        'inner-glass': 'inset 1px 1px 0px rgba(255,255,255,0.10)',
      },

      // ── Backdrop blur ─────────────────────────────────────────────────────
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
};
