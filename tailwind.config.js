/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Le Galet — a candle-lit shelf at dusk. Near-black charcoal washed with
        // warm grey and riverbed taupe; one muted amber for day, slate-blue for night.
        stone: {
          950: "#141519",
          900: "#1c1d22", // base
          850: "#23242a",
          800: "#2b2c33",
          750: "#34353d",
          700: "#3e3f48",
          600: "#52535d",
        },
        taupe: {
          DEFAULT: "#8c8176",
          dim: "#6e655c",
          light: "#b7ab9c",
        },
        mist: {
          DEFAULT: "#d9d3c8", // warm grey text
          soft: "#a8a298",
          faint: "#7c766d",
        },
        quote: "#ece6db",
        amber: {
          DEFAULT: "#cd9a5c", // muted daytime warmth
          deep: "#b07f43",
          soft: "#e0c39b",
        },
        slate: {
          DEFAULT: "#6f8190", // night cool
          deep: "#4f5e6b",
          soft: "#9aa9b5",
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      letterSpacing: {
        breathe: "0.06em",
        wide2: "0.14em",
        wide3: "0.24em",
      },
      keyframes: {
        // The pebble: a long, soft cross-dissolve.
        dissolveIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        dissolveOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        // Gentle Ken Burns drift on photos — four slow variants so it never repeats stale.
        drift0: {
          "0%": { transform: "scale(1.06) translate(-1.5%, -1%)" },
          "100%": { transform: "scale(1.16) translate(1.5%, 1.2%)" },
        },
        drift1: {
          "0%": { transform: "scale(1.14) translate(1.4%, 1%)" },
          "100%": { transform: "scale(1.04) translate(-1.2%, -1.4%)" },
        },
        drift2: {
          "0%": { transform: "scale(1.05) translate(1.6%, -1.2%)" },
          "100%": { transform: "scale(1.15) translate(-1.6%, 1.1%)" },
        },
        drift3: {
          "0%": { transform: "scale(1.15) translate(-1.4%, 1.2%)" },
          "100%": { transform: "scale(1.05) translate(1.4%, -1.1%)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        breathe: "breathe 3.2s ease-in-out infinite",
        rise: "rise 0.5s ease-out both",
      },
      transitionTimingFunction: {
        hush: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
