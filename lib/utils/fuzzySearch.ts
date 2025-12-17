import Fuse from "fuse.js";

export interface SearchableItem {
  titleEn?: string | null;
  titleAm?: string | null;
  aboutEn?: string | null;
  aboutAm?: string | null;
  [key: string]: any;
}

/**
 * Fuzzy search configuration for course search
 * Handles typos, partial matches, and similarity scoring
 */
const fuseOptions = {
  keys: [
    // Prioritize titles - much higher weight (80% of total)
    { name: "titleEn", weight: 0.4 },
    { name: "titleAm", weight: 0.4 },
    // Descriptions have lower weight (20% of total)
    { name: "aboutEn", weight: 0.1 },
    { name: "aboutAm", weight: 0.1 },
  ],
  threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
  distance: 100, // Maximum distance for character matching
  minMatchCharLength: 2, // Minimum character length to match
  includeScore: true, // Include relevance score - results are sorted by best match first
  ignoreLocation: true, // Search anywhere in the string
  findAllMatches: true, // Find all matches, not just the first
  // Sort by score - lower score = better match
  shouldSort: true,
};

/**
 * Performs fuzzy search on an array of items
 * @param items - Array of items to search through
 * @param query - Search query string
 * @returns Array of matching items sorted by relevance
 */
export function fuzzySearch<T extends SearchableItem>(
  items: T[],
  query: string
): T[] {
  if (!query || query.trim().length === 0) {
    return items;
  }

  const trimmedQuery = query.trim();
  
  // If query is very short, use simple substring match for better performance
  if (trimmedQuery.length < 2) {
    return items.filter((item) => {
      const titleEn = item.titleEn?.toLowerCase() || "";
      const titleAm = item.titleAm?.toLowerCase() || "";
      const searchLower = trimmedQuery.toLowerCase();
      return titleEn.includes(searchLower) || titleAm.includes(searchLower);
    });
  }

  // Create Fuse instance with the items
  const fuse = new Fuse(items, fuseOptions);

  // Perform search
  const results = fuse.search(trimmedQuery);

  // Return items sorted by relevance (best matches first)
  return results.map((result) => result.item);
}

