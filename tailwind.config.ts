import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        corporate: {
          dark: '#0F172A', // Slate 900
          navy: '#1E293B', // Slate 800
          muted: '#64748B', // Slate 500
          border: '#E2E8F0', // Slate 200
          bg: '#F8FAFC',    // Slate 50
        }
      },
    },
  },
  plugins: [],
};
export default config;
