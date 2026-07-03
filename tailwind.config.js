/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: "#090A0F",
          800: "#0F111A",
          700: "#171926",
          600: "#222538",
        },
        slate: {
          950: "#0B0F19",
          900: "#111827",
          800: "#1F2937",
          700: "#374151",
        },
        gold: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        board: {
          cream: "#EAE9D2",
          charcoal: "#4B7399", // Classic deep blue-gray chess.com style or charcoal #4E5D6C / #3C4245
          // Let's use a gorgeous charcoal slate gray for dark squares, and premium ivory-cream for light squares.
          light: "#EADDC9",
          dark: "#2A3D4C",
          selected: "rgba(245, 158, 11, 0.4)", // glowing gold selected
          prevMove: "rgba(16, 185, 129, 0.25)", // subtle emerald green for last move
          highlight: "rgba(239, 68, 68, 0.4)", // subtle red for check
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.5)',
        'glow-gold': '0 0 15px rgba(245, 158, 11, 0.5)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
