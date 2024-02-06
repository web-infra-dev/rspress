import { type Config } from 'tailwindcss';

export const tailwindConfig = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    backgroundColor: ctx => ({
      ...ctx.theme('colors'),
      white: 'var(--rp-c-bg)',
      soft: 'var(--rp-c-bg-soft)',
      mute: 'var(--rp-c-bg-mute)',
    }),
    extend: {
      borderRadius: {
        '4xl': '2rem',
      },
      breakpoints: {
        xs: '640px',
        sm: '768px',
        md: '960px',
        lg: '1280px',
      },
      maxWidth: {
        '60': '15rem',
      },
      maxHeight: {
        '60': '15rem',
      },
      colors: {
        brand: {
          DEFAULT: 'var(--rp-c-brand)',
          light: 'var(--rp-c-brand-light)',
          dark: 'var(--rp-c-brand-dark)',
          lighter: 'var(--rp-c-brand-lighter)',
          darker: 'var(--rp-c-brand-darker)',
        },
        text: {
          1: 'var(--rp-c-text-1)',
          2: 'var(--rp-c-text-2)',
          3: 'var(--rp-c-text-3)',
          4: 'var(--rp-c-text-4)',
        },
        divider: {
          DEFAULT: 'var(--rp-c-divider)',
          light: 'var(--rp-c-divider-light)',
          dark: 'var(--rp-c-divider-dark)',
        },
        gray: {
          light: {
            1: 'var(--rp-c-gray-light-1)',
            2: 'var(--rp-c-gray-light-2)',
            3: 'var(--rp-c-gray-light-3)',
            4: 'var(--rp-c-gray-light-4)',
            5: 'var(--rp-c-gray-light-5)',
          },
        },
        dark: {
          light: {
            1: 'var(--rp-c-dark-light-1)',
            2: 'var(--rp-c-dark-light-2)',
            3: 'var(--rp-c-dark-light-3)',
            4: 'var(--rp-c-dark-light-4)',
            5: 'var(--rp-c-dark-light-5)',
          },
        },
      },
    },
  },
} satisfies Config;
