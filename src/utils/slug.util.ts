/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Generate a unique slug by appending timestamp if needed
 * @param text - The text to convert to a slug
 * @returns Unique URL-friendly slug
 */
export function generateUniqueSlug(text: string): string {
  const baseSlug = generateSlug(text);
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string
  return `${baseSlug}-${timestamp}`;
}
