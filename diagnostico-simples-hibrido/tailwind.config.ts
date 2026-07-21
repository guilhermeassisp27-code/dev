import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F2D4A",
        ambar: "#C9882A",
      },
    },
  },
  plugins: [],
};

export default config;
