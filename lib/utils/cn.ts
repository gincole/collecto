import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const mergeClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "display-mobile",
            "page-title",
            "page-title-mobile",
            "section-title",
            "section-title-mobile",
            "card-title",
            "card-title-mobile",
            "body",
            "body-sm",
            "label",
            "caption",
            "ui",
            "input",
            "modal-title",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return mergeClasses(clsx(inputs));
}
