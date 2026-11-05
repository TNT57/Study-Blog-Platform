import { createCn } from "cn/config";

// Our text sizes from globals.css (text-display, text-label, ...).
// cn() must know they are FONT SIZES. Otherwise it thinks "text-label" is a
// text COLOR and deletes the real color, e.g. cn("text-white text-label") → "text-label".
const TEXT_SIZES = [
  "display",
  "h1",
  "h2",
  "h3",
  "body",
  "label",
  "small",
  "caption",
  "timer",
  "timer-phone",
];

// Joins class names and removes Tailwind classes that conflict (the last one wins).
// Always import cn from "@/lib/utils", not from the "cn" package directly.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: TEXT_SIZES }],
    },
  },
});
