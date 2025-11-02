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
          to: 'b',
          linkKey: 'a::b',
          associationsKey: 'key1',
          createdAt: '2025-10-25T06:20:30.000Z',
        },
        {
          id: 'hop2',
          from: 'b',
          to: 'c',
          linkKey: 'b::c',
          associationsKey: 'key2',
          createdAt: '2025-10-25T06:20:31.000Z',
        },
        {
          id: 'hop3',
          from: 'c',
          to: 'd',
          linkKey: 'c::d',
          associationsKey: 'key3',
          createdAt: '2025-10-25T06:20:32.000Z',
        },
      ];

      // a-b-c-d: all words traversed, puzzle complete
      const edges = findEdges(hops, fourWordGame);
      expect(edges).toHaveLength(0);
      expect(edges).toEqual([]);
    });
  });
});
