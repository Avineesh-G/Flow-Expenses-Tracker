/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f6f7f4",
          100: "#e8ebe3",
          200: "#d5daca",
          300: "#b8c2a8",
          400: "#96a582",
          500: "#7a8a64",
          600: "#5f6e4e",
          700: "#4d5840",
          800: "#3f4836",
          900: "#363d2f",
        },
        sand: {
          50: "#fdfbf7",
          100: "#f7f3ea",
          200: "#ece4d5",
          300: "#ded0b5",
          400: "#d0b98f",
          500: "#c4a470",
          600: "#b8925a",
          700: "#997448",
          800: "#7f5f40",
          900: "#684e36",
        },
        mist: {
          50: "#f5f7f9",
          100: "#e4e9ef",
          200: "#cbd4e1",
          300: "#a7b8cc",
          400: "#7d96b3",
          500: "#5e7a9b",
          600: "#4a6280",
          700: "#3d5068",
          800: "#354557",
          900: "#2f3b4a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)",
        card: "0 10px 40px -10px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.03)",
        elevated: "0 20px 50px -12px rgba(0, 0, 0, 0.08), 0 8px 20px -8px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        breathe: "breathe 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
