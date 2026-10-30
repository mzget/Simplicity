/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        simplicity: {
          canvas: "#F4F7FA",
          card: "#FFFFFF",
          text: "#324C5B",
          muted: "#6B7F8E",
          subtle: "#9BAAB5",
          border: "#E2E8F0",
          teal: {
            DEFAULT: "#12C48B",
            hover: "#0FA877",
            light: "#E7F9F3",
            dark: "#0B855D"
          },
          red: {
            DEFAULT: "#F55353",
            hover: "#E04040",
            light: "#FDEEEE",
            dark: "#B82E2E"
          },
          blue: {
            DEFAULT: "#38A3F1",
            light: "#EBF5FE"
          },
          purple: {
            DEFAULT: "#9065ED",
            light: "#F4F0FD"
          },
          amber: {
            DEFAULT: "#FFAA2C",
            light: "#FFF6EA"
          },
          // Dark glass theme palette (aligned with Oaktree Agent)
          dark: {
            canvas: "#0f172a",
            surface: "rgba(15, 20, 28, 0.85)",
            card: "#0f172a",
            cardGlass: "rgba(15, 20, 28, 0.85)",
            border: "rgba(255, 255, 255, 0.1)",
            text: "#f8fafc",
            muted: "#94a3b8",
            subtle: "#64748b",
            accent: "#10b981"
          }
        },
        spendee: {
          canvas: "#F4F7FA",
          card: "#FFFFFF",
          text: "#324C5B",
          muted: "#6B7F8E",
          subtle: "#9BAAB5",
          border: "#E2E8F0",
          teal: {
            DEFAULT: "#12C48B",
            hover: "#0FA877",
            light: "#E7F9F3",
            dark: "#0B855D"
          },
          red: {
            DEFAULT: "#F55353",
            hover: "#E04040",
            light: "#FDEEEE",
            dark: "#B82E2E"
          },
          blue: {
            DEFAULT: "#38A3F1",
            light: "#EBF5FE"
          },
          purple: {
            DEFAULT: "#9065ED",
            light: "#F4F0FD"
          },
          amber: {
            DEFAULT: "#FFAA2C",
            light: "#FFF6EA"
          }
        }
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'simplicity': '0 4px 14px 0 rgba(48, 82, 120, 0.07)',
        'simplicity-hover': '0 8px 24px 0 rgba(48, 82, 120, 0.12)',
        'simplicity-modal': '0 20px 40px 0 rgba(31, 53, 74, 0.16)',
        'simplicity-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'spendee': '0 4px 14px 0 rgba(48, 82, 120, 0.07)',
        'spendee-hover': '0 8px 24px 0 rgba(48, 82, 120, 0.12)',
        'spendee-modal': '0 20px 40px 0 rgba(31, 53, 74, 0.16)'
      }
    },
  },
  plugins: [],
}
