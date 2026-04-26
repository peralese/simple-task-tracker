/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f4efe5",
        ink: "#1b221d",
        moss: "#123524",
        amber: "#efb24b",
        rose: "#d56056",
        mist: "#fbf8f1"
      },
      boxShadow: {
        panel: "0 18px 40px rgba(27, 34, 29, 0.08)"
      },
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};
