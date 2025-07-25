import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themess: ["light", "dark","forest"]
  }
}