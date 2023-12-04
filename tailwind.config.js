/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "animate-pop": {
          "0%": {
            transform: "scale(0.5, 0.5)",
          },
          "100%": {
            transform: "scale(1, 1)",
          },
        },

        "fade-in": {
          "0%": {
            opacity: 0,
          },
          "100%": {
            opacity: 1,
          },
        },
      },
    },
  },
  plugins: [],
}
