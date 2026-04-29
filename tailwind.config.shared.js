/** waki-shell / tailwind.config.shared.js
 *  ----------------------------------------------------------------------------
 *  Shared Tailwind config that every consumer app should spread into
 *  its own config. Owns:
 *   - The slate palette tuning (50, 700, 800, 900) that the dark-mode
 *     safety net in styles/dark-mode-safety.css references by literal
 *     RGB. Without this spread, the safety net's slate-800 #324663
 *     would not match the consumer's own slate-800.
 *   - The shared sans-serif font stack.
 *   - `darkMode: "class"` so the `dark` / `light` html-class strategy
 *     used by useTheme + the inline bootstrap snippet works.
 *
 *  Consumer usage (frontend/tailwind.config.js):
 *
 *    import shared from "waki-shell/tailwind.config.shared.js";
 *
 *    export default {
 *      ...shared,
 *      content: ["./index.html", "./src/**\/*.{ts,tsx}"],
 *    };
 *
 *  Apps that want extra colours / plugins extend `theme.extend` /
 *  `plugins` after the spread.
 */

/** @type {Partial<import('tailwindcss').Config>} */
const shared = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // Theme tuning: shift slate page-and-card shades to give the
        // dark theme real layered depth. Page sits a step darker than
        // cards; cards sit a step brighter than the page so panels
        // float visibly. The literal RGB values are referenced by
        // styles/dark-mode-safety.css — keep them aligned.
        slate: {
          50: "#eef2f7",
          700: "#42587a",
          800: "#324663",
          900: "#243550",
        },
      },
    },
  },
  plugins: [],
};

export default shared;
