import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [tailwindcssAnimate, typography],
  prefix: '',
  safelist: [
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-8',
    'lg:col-span-12',
    'border-border',
    'bg-card',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        '2xl': '2rem',
        DEFAULT: '1rem',
        lg: '2rem',
        md: '2rem',
        sm: '1rem',
        xl: '2rem',
      },
      screens: {
        '2xl': '92rem',
        lg: '78rem',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        background: 'var(--background)',
        border: 'var(--border)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        foreground: 'var(--foreground)',
        input: 'var(--input)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        ring: 'var(--ring)',
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        'pafe-blue': {
          50: 'oklch(0.972 0.014 249)',
          100: 'oklch(0.938 0.031 249)',
          200: 'oklch(0.885 0.056 249)',
          300: 'oklch(0.806 0.088 249)',
          400: 'oklch(0.705 0.127 249)',
          500: 'oklch(0.615 0.142 249)',
          600: 'oklch(0.53 0.13 249)',
          700: 'oklch(0.45 0.112 249)',
          800: 'oklch(0.38 0.092 249)',
          900: 'oklch(0.31 0.07 249)',
          950: 'oklch(0.22 0.048 249)',
        },
        'pafe-orange': {
          50: 'oklch(0.975 0.018 53)',
          100: 'oklch(0.946 0.04 53)',
          200: 'oklch(0.894 0.077 53)',
          300: 'oklch(0.83 0.117 53)',
          400: 'oklch(0.766 0.147 53)',
          500: 'oklch(0.707 0.164 53)',
          600: 'oklch(0.638 0.157 53)',
          700: 'oklch(0.545 0.135 53)',
          800: 'oklch(0.45 0.108 53)',
          900: 'oklch(0.37 0.083 53)',
          950: 'oklch(0.25 0.055 53)',
        },
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-jakarta)', 'var(--font-inter)', 'ui-sans-serif', 'sans-serif'],
        bubblegum: ['Bubblegum Sans', 'serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--text)',
              '--tw-prose-headings': 'var(--text)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
