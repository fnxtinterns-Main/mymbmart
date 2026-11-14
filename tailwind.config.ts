import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0D2C6C",
          "navy-dark": "#0A2255",
          "navy-light": "#1B3E8C",
          green: "#064E3B",
          "green-light": "#0D684D",
          "green-badge": "#16A34A",
          orange: "#FF5722",
          "orange-hover": "#E64A19",
          "orange-light": "#FFF3EE",
          cyan: "#0284C7",
          "cyan-light": "#E0F2FE",
          surface: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
