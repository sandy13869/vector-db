/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#b9ccff",
          300: "#8da8ff",
          400: "#5f7dff",
          500: "#4f6cf7",
          600: "#3b54e0",
          700: "#2f43b8",
          800: "#293996",
          900: "#263377",
        },
        surface: {
          DEFAULT: "#ffffff",
          dark: "#0f172a",
        },
        panel: {
          DEFAULT: "#f8fafc",
          dark: "#1e293b",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-dot": "pulseDot 1.4s infinite ease-in-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)" },
          "40%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
