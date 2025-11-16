import { findEdges } from './edgeFinder';
import type { Hop, Game } from './types';

describe('edgeFinder', () => {
  const mockGame: Game = {
    id: 'game-niner',
    words: ['chicanery', 'mountain'],
  };

  describe('findEdges', () => {
    it('returns both game words when no hops exist', () => {
      const edges = findEdges([], mockGame);

      expect(edges).toHaveLength(2);
      expect(edges).toEqual(['chicanery', 'mountain']);
    });

    it('moves the edge when you hop', () => {
      const hops: Hop[] = [
        {
          id: 'hop1',
          from: 'chicanery',
          to: 'deceit',
          linkKey: 'chicanery::deceit',
          associationsKey: 'key1',
          createdAt: '2025-10-25T06:20:32.743Z',
        },
      ];

      const edges = findEdges(hops, mockGame);

      // Edge moved from chicanery to deceit
      expect(edges).toHaveLength(2);
      expect(edges).toContain('deceit');
      expect(edges).toContain('mountain');
      expect(edges).not.toContain('chicanery');
    });

    it('closes a loop with 3 edges and removes one', () => {
      const threeWordGame: Game = {
        id: 'game-three',
        words: ['a', 'b', 'c'],
      };

      const hops: Hop[] = [
        {
          id: 'hop1',
          from: 'a',
          to: 'b',
          linkKey: 'a::b',
          associationsKey: 'key1',
          createdAt: '2025-10-25T06:20:30.000Z',
        },
      ];

      // a-b-c: hop from a to b closes the loop, removes both a and b
      const edges = findEdges(hops, threeWordGame);
      expect(edges).toHaveLength(1);
      expect(edges).toEqual(['c']);
    });

    it('uses linkKey direction, not from/to fields', () => {
      const hops: Hop[] = [
        {
          id: 'hop1',
          // User hopped backwards, so from/to are reversed
          from: 'deceit',
          to: 'chicanery',
          // But linkKey has canonical direction
          linkKey: 'chicanery::deceit',
          associationsKey: 'key1',
          createdAt: '2025-10-25T06:20:32.743Z',
        },
      ];

      const edges = findEdges(hops, mockGame);

      // Edge moved from chicanery to deceit (based on linkKey, not from/to)
      expect(edges).toHaveLength(2);
      expect(edges).toContain('deceit');
      expect(edges).toContain('mountain');
      expect(edges).not.toContain('chicanery');
    });

    it('returns empty array when one hop closes loop in 2-word puzzle', () => {
      const hops: Hop[] = [
        {
          id: 'hop1',
          from: 'chicanery',
          to: 'mountain',
          linkKey: 'chicanery::mountain',
          associationsKey: 'key1',
          createdAt: '2025-10-25T06:20:32.743Z',
        },
      ];

      // chicanery-mountain: hop from chicanery to mountain closes the loop
      const edges = findEdges(hops, mockGame);
      expect(edges).toHaveLength(0);
      expect(edges).toEqual([]);
    });

    it('returns empty array when all words have been traversed', () => {
      const fourWordGame: Game = {
        id: 'game-four',
        words: ['a', 'b', 'c', 'd'],
      };

      const hops: Hop[] = [
        {
          id: 'hop1',
          from: 'a',
          to: 'x',
          linkKey: 'a::x',
          associationsKey: 'key1',
          createdAt: '2025-10-25T06:20:30.000Z',
        },
        {
          id: 'hop2',
          from: 'x',
          to: 'b',
          linkKey: 'b::x',
          associationsKey: 'key2',
          createdAt: '2025-10-25T06:20:31.000Z',
        },
        {
          id: 'hop3',
          from: 'b',
          to: 'z',
          linkKey: 'b::z',
          associationsKey: 'key3',
          createdAt: '2025-10-25T06:20:32.000Z',
        },
        {
          id: 'hop4',
          from: 'z',
          to: 'c',
          linkKey: 'c::z',
          associationsKey: 'key4',
          createdAt: '2025-10-25T06:20:33.000Z',
        },
        {
          id: 'hop5',
          from: 'c',
          to: 'y',
          linkKey: 'c::y',
          associationsKey: 'key5',
          createdAt: '2025-10-25T06:20:34.000Z',
        },
        {
          id: 'hop6',
          from: 'y',
          to: 'd',
          linkKey: 'd::y',
          associationsKey: 'key6',
          createdAt: '2025-10-25T06:20:35.000Z',
        },
        {
          id: 'hop7',
          from: 'z',
          to: 'y',
          linkKey: 'y::z',
          associationsKey: 'key7',
          createdAt: '2025-10-25T06:20:36.000Z',
        },
      ];

      // a-x-b-z-c-y-d with z-y closing final loop
      const edges = findEdges(hops, fourWordGame);
      expect(edges).toHaveLength(0);
      expect(edges).toEqual([]);
    });

    it('closes loop when two hops converge on same word (planar->flat, rat->flat)', () => {
      const realGame: Game = {
        id: 'rRuUbuuMUuBbumuUbmmrMRUM',
        words: ['planar', 'rat'],
      };

      const hops: Hop[] = [
        {
          id: 'QrZiHZiAP2cURpEIubEFB',
          linkKey: 'flat::planar',
          associationsKey: 'means|popAdjPair|precededBy',
          from: 'planar',
          to: 'flat',
          createdAt: '2025-11-15T23:14:35.778Z',
        },
        {
          id: '47fyPVd3Ti8kMShff32tO',
          linkKey: 'flat::rat',
          associationsKey: 'rhyme',
          from: 'rat',
          to: 'flat',
          createdAt: '2025-11-15T23:14:36.350Z',
        },
      ];

      // planar-rat: both hop to flat, closing the loop
      const edges = findEdges(hops, realGame);
      expect(edges).toHaveLength(0);
      expect(edges).toEqual([]);
    });
  });
});
