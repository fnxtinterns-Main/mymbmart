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
          forest: "#064E3B",        // Deep Forest Green · Brand identity, navigation, headings
          green: "#16A34A",         // Fresh Green · Savings, success, benefits
          "green-hover": "#15803D",
          orange: "#FF5722",        // Saffron Orange · Shop Now, Join Free, CTAs
          "orange-hover": "#E64A19",
          "orange-light": "#FFF3EE",
          blue: "#0284C7",          // Electric Blue · Discounts, offers, highlights
          "blue-light": "#E0F2FE",
          mint: "#E6F7EE",          // Fresh Mint · Backgrounds and cards
          "mint-light": "#F2FBF6",
          charcoal: "#0F172A",      // Charcoal Slate · Body text and readability
          slate: "#334155",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
