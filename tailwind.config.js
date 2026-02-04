/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: "hsl(260 70% 85%)",
        "blush-pink": "hsl(350 85% 80%)",
        "pale-mint": "hsl(160 60% 85%)",
        "slate-purple": "hsl(260 30% 35%)",
        "soft-white": "hsl(0 0% 98%)",
        "muted-gray": "hsl(0 0% 65%)",
      },
      maxWidth: {
        "7xl": "80rem",
      },
      spacing: {
        0: "0",
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        6: "1.5rem",
        8: "2rem",
        12: "3rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
        32: "8rem",
        40: "10rem",
        48: "12rem",
        64: "16rem",
        80: "20rem",
        96: "24rem",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
