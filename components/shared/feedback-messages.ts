import type { Route } from "next";

const messages = {
  "collection-created":
    "Collection created. You can customize its Fields in Collection settings.",
  "collection-deleted":
    "Collection deleted. Private image cleanup has been scheduled where needed.",
  "item-created": "Item created.",
  "item-updated": "Item saved.",
  "item-deleted":
    "Item deleted. Private image cleanup has been scheduled where needed.",
  "logged-in": "You are logged in.",
  "logged-out": "You are logged out.",
} as const;
export type FeedbackCode = keyof typeof messages;

export function feedbackMessage(code: string | null) {
  return code && Object.hasOwn(messages, code)
    ? messages[code as FeedbackCode]
    : undefined;
}

export function feedbackHref(href: string, code: FeedbackCode): Route {
  const url = new URL(href, "http://local.invalid");
  url.searchParams.set("feedback", code);
  return `${url.pathname}${url.search}${url.hash}` as Route;
}
