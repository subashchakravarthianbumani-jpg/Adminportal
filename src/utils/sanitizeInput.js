export function sanitizeInput(value = "") {
  if (typeof value !== "string") return value;

  // Remove HTML tags
  value = value.replace(/<[^>]*>?/gm, '');

  // Remove script tags specifically
  value = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

  // Remove XML-like content
  value = value.replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/gi, '');

  // Remove on-event handlers like onclick, onload
  value = value.replace(/on\w+="[^"]*"/gi, '');

  // Remove JavaScript: URLs
  value = value.replace(/javascript:/gi, '');

  return value.trim();
}
