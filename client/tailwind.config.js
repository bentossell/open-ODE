module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#FDFDFD", // background color of sidebar
          foreground: "#1F1F1F",
          muted: {
            foreground: "#727272"
          },
          accent: {
            DEFAULT: "#F5F5F5",
            foreground: "#1F1F1F"
          },
          border: "#E5E5E5",
          ring: "#BDBDBD"
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#737373"
        },
        accent: {
          DEFAULT: "#F5F5F5",
          foreground: "#262626"
        },
        border: "#E5E5E5",
        "input-border": "#D1D5DB",
        highlight: {
          DEFAULT: "#FAFAFA",
          foreground: "#2E2E2E"
        },
        "sidebar-border": "#E5E5E5"
      },
      fontFamily: {
        sans: [
          'Geist',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'Fira Code',
          'monospace'
        ]
      }
    }
  },
  plugins: []
};