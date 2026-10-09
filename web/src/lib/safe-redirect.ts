// Only same-site paths are allowed, so a crafted link cannot send a
// signed-in user to another website.
export function safeNextPath(value: unknown): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return value;
  }
  return "/";
}
