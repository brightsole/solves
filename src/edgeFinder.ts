import type { Hop, Game } from './types';

/**
 * Finds all available edge words given the current hops and game state.
 * Returns an array of words that are valid destinations.
 *
 * @param hops - Array of hops already taken in this attempt
 * @param game - The game being played with start/end words
 * @returns Array of valid destination words
 */
export function findEdges(hops: Hop[], game: Game): string[] {
  // Start with all game words
  return hops.reduce(
    (edges, hop) => {
      // Parse linkKey to get canonical from->to direction
      const [from, to] = hop.linkKey!.split('::');

      const fromIndex = edges.indexOf(from);
      const toIndex = edges.indexOf(to);

      // If hop.to was already in edges AND hop.from is in edges, we're closing a loop
      if (toIndex !== -1 && fromIndex !== -1) {
        // Remove both edges since we're closing the loop
        return edges.filter((word) => word !== from && word !== to);
      }

      // If hop.from is in edges, replace it with hop.to
      if (fromIndex !== -1) {
        edges[fromIndex] = to;
      }

      return edges;
    },
    [...game.words],
  );
}
