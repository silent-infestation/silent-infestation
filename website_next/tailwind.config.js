const { hover } = require("framer-motion");
const { element } = require("prop-types");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "grey-500": "#808080",
        background: "var(--background)",
        foreground: "var(--foreground)",
        element: "var(--background-element)",
      },
      boxShadow: {
        default: "var(--box-shadow)",
        hover: "var(--box-shadow-hover)",
        active: "var(--box-shadow-active)",
      },
      backgroundColor: {
        default: "var(--background-color)",
      },
      borderColor: {
        default: "#ccc",
        focusWithin: "rgba(68, 68, 68, 0.5)",
      },
    },
  },
  plugins: [],
};
