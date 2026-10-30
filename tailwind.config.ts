import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf3",
          100: "#d1fadf",
          500: "#12a150",
          600: "#008751",
          700: "#036b3f",
          800: "#05532f",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
