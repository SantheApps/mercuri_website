module.exports = {
  darkMode: "class",
  content: [
    "./*.html",
    "./components/*.html",
    "./js/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#EB973D",
        // brand orange darkened to 5.1:1 on the page background, for orange text and icons in light mode
        "primary-ink": "#9B5E1C",
        "background-light": "#fdfdfb",
        "background-dark": "#0f172a",
        charcoal: "#1a1a1a"
      },
      fontFamily: {
        display: ["Instrument Serif", "serif"],
        sans: ["Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        xl: "1rem",
        "2xl": "1.5rem"
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography")
  ]
};
