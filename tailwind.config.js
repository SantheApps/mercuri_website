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
        "background-light": "#F3F3F3",
        "background-dark": "#0f172a",
        charcoal: "#1a1a1a"
      },
      fontFamily: {
        display: ["Instrument Serif", "serif"],
        sans: ["Geist", "Inter", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
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
