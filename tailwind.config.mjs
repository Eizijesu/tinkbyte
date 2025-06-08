// tailwind.config.mjs - Enhanced TinkByte Tailwind Configuration
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './tina/**/*.{js,jsx,ts,tsx}',
    './public/**/*.html',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      // Enhanced font family configuration
      fontFamily: {
        sans: [
          '"Space Grotesk"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        'space-grotesk': [
          '"Space Grotesk"',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'Monaco',
          '"Courier New"',
          'monospace',
        ],
        // Add serif for potential blog content
        serif: [
          '"Crimson Text"',
          'Georgia',
          'Times',
          '"Times New Roman"',
          'serif',
        ],
      },

      // Enhanced color system
      colors: {
        brand: {
          50: '#f0f2ff',
          100: '#e8ebf4',
          200: '#b4bce1',
          300: '#9ca5d4',
          400: '#7a85c7',
          500: '#243788', // Primary brand color
          600: '#1a2b5c', // Dark brand color
          700: '#162348',
          800: '#121b34',
          900: '#0e1520',
          // Additional brand utilities
          primary: '#243788',
          secondary: '#b4bce1',
          dark: '#1a2b5c',
          light: '#e8ebf4',
        },
        // Enhanced gray scale
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        // Semantic colors for better UX
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },

      // Enhanced typography scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '7xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '8xl': ['6rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '9xl': ['8rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        // TinkByte specific sizes
        'hero': ['clamp(2rem, 5vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'feature': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'section': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
      },

      // Enhanced letter spacing
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        'ultra-wide': '0.15em',
      },

      // Enhanced line heights
      lineHeight: {
        'extra-tight': '1.1',
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
        '3': '.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '9': '2.25rem',
        '10': '2.5rem',
      },

      // Enhanced spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '176': '44rem',
        '192': '48rem',
        // TinkByte specific spacing
        'magazine': '4.5rem',
        'section': '6rem',
      },

      // Enhanced border radius
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '9999px',
        // TinkByte specific radius
        'tinkbyte': '2px',
        'tinkbyte-card': '4px',
        'tinkbyte-button': '2px',
        'tinkbyte-image': '4px',
      },

      // Enhanced box shadows
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'none': 'none',
        // TinkByte specific shadows
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
        'magazine': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'magazine-lg': '0 10px 40px rgba(0, 0, 0, 0.15)',
        'brand': '0 4px 25px -5px rgba(36, 55, 136, 0.1), 0 10px 10px -5px rgba(36, 55, 136, 0.04)',
      },

      // Enhanced screen breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1600px',
        '4xl': '1920px',
        // Custom breakpoints for TinkByte
        'mobile': '475px',
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
        'wide': '1600px',
      },

      // Enhanced animations and keyframes
      keyframes: {
        // Existing animations
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        // New TinkByte specific animations
        "magazine-entrance": {
          "0%": { opacity: "0", transform: "translateY(40px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "rotate-in": {
          "0%": { opacity: "0", transform: "rotate(-10deg) scale(0.9)" },
          "100%": { opacity: "1", transform: "rotate(0deg) scale(1)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },

      animation: {
        // Existing animations
        blob: "blob 7s infinite",
        "fade-in": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-up": "slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-down": "slide-down 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "scale-in": "scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // New TinkByte animations
        "magazine-entrance": "magazine-entrance 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        "slide-in-left": "slide-in-left 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "rotate-in": "rotate-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "shimmer": "shimmer 2s infinite",
        // Delayed animations
        "fade-in-delay-100": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards",
        "fade-in-delay-200": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards",
        "fade-in-delay-300": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards",
        "fade-in-delay-500": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards",
      },

      // Enhanced backdrop blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // Enhanced z-index scale
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'auto': 'auto',
        // TinkByte specific z-index
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },

      // Enhanced typography configuration
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            lineHeight: '1.7',
            fontSize: '1.125rem',
            a: {
              color: 'rgb(59 130 246)',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline',
                textDecorationThickness: '2px',
                textUnderlineOffset: '2px',
                color: 'rgb(29 78 216)',
              },
            },
            '[class~="lead"]': {
              color: 'inherit',
              fontSize: '1.25rem',
              lineHeight: '1.6',
              marginTop: '1.2em',
              marginBottom: '1.2em',
            },
            strong: {
              color: 'inherit',
              fontWeight: '600',
            },
            'h1, h2, h3, h4, h5, h6': {
              color: 'inherit',
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
              fontWeight: '600',
              letterSpacing: '-0.025em',
              scrollMarginTop: '2rem',
            },
            h1: {
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: '700',
              lineHeight: '1.1',
              marginTop: '0',
              marginBottom: '0.8888889em',
            },
            h2: {
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '600',
              lineHeight: '1.2',
              marginTop: '2em',
              marginBottom: '1em',
            },
            h3: {
              fontSize: '1.875rem',
              fontWeight: '600',
              lineHeight: '1.2',
              marginTop: '1.6em',
              marginBottom: '0.6em',
            },
            h4: {
              fontSize: '1.5rem',
              fontWeight: '600',
              lineHeight: '1.375',
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            blockquote: {
              color: 'inherit',
              borderLeftColor: 'currentColor',
              borderLeftWidth: '4px',
              paddingLeft: '1em',
              fontStyle: 'italic',
              fontSize: '1.125em',
              lineHeight: '1.5555556',
              marginTop: '1.6em',
              marginBottom: '1.6em',
            },
            code: {
              color: 'inherit',
              backgroundColor: 'rgb(243 244 246)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              color: 'rgb(243 244 246)',
              backgroundColor: 'rgb(17 24 39)',
              borderRadius: '0.5rem',
              padding: '1rem',
              overflowX: 'auto',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
              marginTop: '1.7142857em',
              marginBottom: '1.7142857em',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              borderRadius: '0',
              fontWeight: 'normal',
              color: 'inherit',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.625em',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.625em',
            },
            'ul, ol': {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            li: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            table: {
              width: '100%',
              tableLayout: 'auto',
              textAlign: 'left',
              marginTop: '2em',
              marginBottom: '2em',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
            },
            thead: {
              color: 'inherit',
              fontWeight: '600',
              borderBottomWidth: '1px',
              borderBottomColor: 'currentColor',
            },
            'thead th': {
              verticalAlign: 'bottom',
              paddingRight: '0.5714286em',
              paddingBottom: '0.5714286em',
              paddingLeft: '0.5714286em',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'currentColor',
            },
            'tbody td': {
              verticalAlign: 'baseline',
              paddingTop: '0.5714286em',
              paddingRight: '0.5714286em',
              paddingBottom: '0.5714286em',
              paddingLeft: '0.5714286em',
            },
          },
        },
        // Dark mode typography
        invert: {
          css: {
            color: 'rgb(243 244 246)',
            a: {
              color: 'rgb(96 165 250)',
              '&:hover': {
                color: 'rgb(147 197 253)',
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              color: 'rgb(243 244 246)',
            },
            code: {
              backgroundColor: 'rgb(31 41 55)',
              color: 'rgb(243 244 246)',
            },
            blockquote: {
              borderLeftColor: 'rgb(75 85 99)',
              color: 'rgb(209 213 219)',
            },
            'thead th': {
              color: 'rgb(243 244 246)',
              borderBottomColor: 'rgb(75 85 99)',
            },
            'tbody tr': {
              borderBottomColor: 'rgb(75 85 99)',
            },
          },
        },
        // Compact prose for smaller content areas
        sm: {
          css: {
            fontSize: '0.875rem',
            lineHeight: '1.7142857',
            p: {
              marginTop: '1.1428571em',
              marginBottom: '1.1428571em',
            },
            h1: {
              fontSize: '2.1428571em',
              marginTop: '0',
              marginBottom: '0.8em',
              lineHeight: '1.2',
            },
            h2: {
              fontSize: '1.4285714em',
              marginTop: '1.6em',
              marginBottom: '0.8em',
              lineHeight: '1.4',
            },
            h3: {
              fontSize: '1.2857143em',
              marginTop: '1.5555556em',
              marginBottom: '0.4444444em',
              lineHeight: '1.5555556',
            },
          },
        },
        // Large prose for featured content
        lg: {
          css: {
            fontSize: '1.125rem',
            lineHeight: '1.7777778',
            p: {
              marginTop: '1.3333333em',
              marginBottom: '1.3333333em',
            },
            h1: {
              fontSize: '2.6666667em',
              marginTop: '0',
              marginBottom: '0.8333333em',
              lineHeight: '1',
            },
            h2: {
              fontSize: '1.6666667em',
              marginTop: '1.8666667em',
              marginBottom: '1.0666667em',
              lineHeight: '1.3333333',
            },
            h3: {
              fontSize: '1.3333333em',
              marginTop: '1.6666667em',
              marginBottom: '0.6666667em',
              lineHeight: '1.5',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    // Custom plugin for TinkByte utilities
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': 'rgb(156 163 175) transparent',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgb(243 244 246)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgb(156 163 175)',
            borderRadius: '3px',
          },
        },
      };

      const newComponents = {
        '.btn': {
          padding: '0.5rem 1rem',
          borderRadius: theme('borderRadius.tinkbyte-button'),
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          border: 'none',
          textDecoration: 'none',
          '&:focus-visible': {
            outline: '2px solid transparent',
            outlineOffset: '2px',
            boxShadow: '0 0 0 2px rgb(59 130 246), 0 0 0 4px rgba(59, 130, 246, 0.2)',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.card': {
          backgroundColor: 'white',
          border: '1px solid rgb(229 231 235)',
          borderRadius: theme('borderRadius.tinkbyte-card'),
          boxShadow: theme('boxShadow.soft'),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      };

      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
};