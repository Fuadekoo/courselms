/**
 * Normalizes a URL by removing trailing slashes from the base URL
 * and ensuring the path starts with a single slash
 */
export function normalizeUrl(baseUrl: string, path: string): string {
  // Remove trailing slashes from base URL
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  
  // Ensure path starts with a single slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${normalizedBase}${normalizedPath}`;
}

