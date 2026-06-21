/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          500: "#4f6cf7",
          600: "#3b54e0",
          700: "#2f43b8"
        }
      }
    }
  },
  plugins: []
};
