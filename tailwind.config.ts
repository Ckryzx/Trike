import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "var(--color-primary)", foreground: "var(--color-primary-foreground)" },
        secondary: { DEFAULT: "var(--color-secondary)", foreground: "var(--color-secondary-foreground)" },
        accent: { DEFAULT: "var(--color-accent)", foreground: "var(--color-accent-foreground)" },
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: { DEFAULT: "var(--color-card)", foreground: "var(--color-card-foreground)" },
        muted: { DEFAULT: "var(--color-muted)", foreground: "var(--color-muted-foreground)" },
        border: "var(--color-border)",
        destructive: { DEFAULT: "var(--color-destructive)", foreground: "var(--color-destructive-foreground)" },
        ring: "var(--color-ring)",
        warning: { DEFAULT: "var(--color-warning)", bg: "var(--color-warning-bg)", foreground: "var(--color-warning-foreground)" },
        success: { bg: "var(--color-success-bg)", foreground: "var(--color-success-foreground)" },
        danger: { bg: "var(--color-danger-bg)", foreground: "var(--color-danger-foreground)" },
      },
      fontFamily: {
        heading: ["var(--font-lexend)", "sans-serif"],
        body: ["var(--font-source-sans)", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
