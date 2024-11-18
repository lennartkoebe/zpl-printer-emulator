import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

export default {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [forms()],
} satisfies Config;
