import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        seraya: {
          ink: "#24231f",
          gold: "#b28a45",
          orange: "#c66a3b",
          cream: "#f7f4ed"
        }
      }
    }
  },
  plugins: []
};

export default config;
