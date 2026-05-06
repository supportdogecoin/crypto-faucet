import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        crypto: {
          gold: '#FFD700',
          dark: '#0F0F23',
          darker: '#0A0A1A',
          accent: '#00D4FF',
          success: '#00FF94',
          warning: '#FFA500',
          danger: '#FF4757',
        },
      },
    },
  },
  plugins: [],
}
export default config
