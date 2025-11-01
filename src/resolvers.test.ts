import { startController } from './controller';
import resolvers from './resolvers';
import type { DBSolve } from './types';
import type { Solve } from './generated/graphql';

const defaultSolve = {
  id: 'solve-123',
  ownerId: 'owner',
  gameId: 'game-456',
  associationsKey: 'assoc-101',
  hopsIds: ['hop1', 'hop2', 'hop3'],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
} as unknown as DBSolve;

type ResolverFunction = (
  parent: unknown,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: unknown,
) => unknown;

const callResolver = async (
  resolver: unknown,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  parent?: unknown,
) => {
  if (!resolver) throw new Error('Resolver is undefined');
  const fn = resolver as ResolverFunction;
  return fn(parent || {}, args, context, undefined);
};

const createSolveControllerMock = (
  overrides: Partial<ReturnType<typeof startController>> = {},
): ReturnType<typeof startController> => ({
  getById: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(defaultSolve),
  ...overrides,
});

const Query = resolvers.Query!;

describe('Resolvers', () => {
  describe('Query', () => {
    it('fetches a solve given an id', async () => {
      const solveController = createSolveControllerMock({
        getById: jest.fn().mockResolvedValue(defaultSolve),
      });

      const solve = await callResolver(
        Query.solve,
        { id: 'solve-123' },
        { solveController, event: {} },
      );

      expect(solve).toEqual(defaultSolve);
      expect(solveController.getById).toHaveBeenCalledWith('solve-123');
    });

    it('returns null for an unknown solve', async () => {
      const solveController = createSolveControllerMock({
        getById: jest.fn().mockResolvedValue(undefined),
      });

      const solve = await callResolver(
        Query.solve,
        { id: 'unknown' },
        { solveController, event: {} },
      );
      expect(solve).toBeUndefined();
    });

    it('lists solves for a query', async () => {
      const results = [
        {
          id: 'solve-1',
          ownerId: 'you',
          gameId: 'game-1',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-03T00:00:00.000Z'),
        },
        {
          id: 'solve-2',
          ownerId: 'you',
          gameId: 'game-2',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-03T00:00:00.000Z'),
        },
      ].map((solve) => ({ ...defaultSolve, ...solve })) as unknown as DBSolve[];

      const solveController = createSolveControllerMock({
        query: jest.fn().mockResolvedValue(results),
      });

      const solves = await callResolver(
        Query.solves,
        { query: { ownerId: 'you' } },
        { solveController, event: {} },
      );

      expect(solves).toEqual(results);
      expect(solveController.query).toHaveBeenCalledWith({ ownerId: 'you' });
    });
  });

  describe('Mutation', () => {
    it('creates an attempt with generated id', async () => {
      const attempt = await callResolver(
        resolvers.Mutation?.startAttempt,
        { gameId: 'game-456' },
        {
          ownerId: 'user-123',
          solveController: createSolveControllerMock(),
          event: {},
        },
      );

      expect(attempt).toEqual({
        id: expect.stringMatching(/^[hisSk_~-]{24}$/),
        gameId: 'game-456',
        ownerId: 'user-123',
        hopsIds: [],
        associationsKey: '',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('creates an attempt without gameId when not provided', async () => {
      const attempt = await callResolver(
        resolvers.Mutation?.startAttempt,
        { gameId: undefined },
        {
          ownerId: 'user-456',
          solveController: createSolveControllerMock(),
          event: {},
        },
      );

      expect(attempt).toEqual({
        id: expect.stringMatching(/^[hisSk_~-]{24}$/),
        gameId: undefined,
        ownerId: 'user-456',
        hopsIds: [],
        associationsKey: '',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('generates unique ids for each attempt', async () => {
      const attempt1 = (await callResolver(
        resolvers.Mutation?.startAttempt,
        { gameId: 'game-1' },
        {
          ownerId: 'user-1',
          solveController: createSolveControllerMock(),
          event: {},
        },
      )) as Solve;

      const attempt2 = (await callResolver(
        resolvers.Mutation?.startAttempt,
        { gameId: 'game-2' },
        {
          ownerId: 'user-2',
          solveController: createSolveControllerMock(),
          event: {},
        },
      )) as Solve;

      expect(attempt1.id).not.toEqual(attempt2.id);
      expect(attempt1.id).toMatch(/^[hisSk_~-]{24}$/);
      expect(attempt2.id).toMatch(/^[hisSk_~-]{24}$/);
    });
  });

  describe('Solve', () => {
    it('resolves game reference from gameId', async () => {
      const solve = {
        ...defaultSolve,
        gameId: 'game-789',
      };

      const game = await callResolver(
        resolvers.Solve?.game,
        {},
        { solveController: createSolveControllerMock(), event: {} },
        solve,
      );

      expect(game).toEqual({
        __typename: 'Game',
        id: 'game-789',
      });
    });

    it('resolves hops from hopsIds', async () => {
      const solve = {
        ...defaultSolve,
        hopsIds: ['hop1', 'hop2', 'hop3'],
      };

      const hops = await callResolver(
        resolvers.Solve?.hops,
        {},
        { solveController: createSolveControllerMock(), event: {} },
        solve,
      );

      expect(hops).toEqual([
        { __typename: 'Hop', id: 'hop1' },
        { __typename: 'Hop', id: 'hop2' },
        { __typename: 'Hop', id: 'hop3' },
      ]);
    });
  });
});
