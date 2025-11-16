import type { Hop, Game } from './types';

export const findEdges = (hops: Hop[], game: Game): string[] =>
  hops.reduce(
    (edges, { linkKey }) => {
      if (!linkKey) return edges;

      const [from, to] = linkKey.split('::');
      const hasFrom = edges.includes(from);
      const hasTo = edges.includes(to);

      // both present → close loop, drop both
      if (hasFrom && hasTo) {
        return edges.filter((w) => w !== from && w !== to);
      }

      // exactly one present → swap it for the other (first occurrence only)
      if (hasFrom || hasTo) {
        const target = hasFrom ? from : to;
        const replacement = hasFrom ? to : from;

        let replaced = false;
        return edges.map((w) => {
          if (!replaced && w === target) {
            replaced = true;
            return replacement;
          }
          return w;
        });
      }

      // neither present → noop
      return edges;
    },
    [...game.words],
  );
