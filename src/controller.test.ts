import type { ModelType, DBSolve, Context } from './types';
import { Query as QueryType } from 'dynamoose/dist/ItemRetriever';

type SolveModelMock = jest.Mocked<ModelType & QueryType<DBSolve>>;

const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

let createSolveController: (typeof import('./controller'))['createSolveController'];

beforeEach(async () => {
  jest.resetModules();
  mockFetch.mockClear();
  ({ createSolveController } = await import('./controller'));
});

const createSolveModelMock = (
  overrides: Partial<SolveModelMock> = {},
): SolveModelMock => {
  return {
    get: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    using: jest.fn().mockReturnThis(),
    exec: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    ...overrides,
  } as SolveModelMock;
};

describe('solve controller', () => {
  describe('.getById(solveId): Solve', () => {
    it('fetches a solve given an id', async () => {
      const SolveModel = createSolveModelMock({
        get: jest.fn().mockResolvedValue({ id: 'solve-123' }),
      });

      const solve =
        await createSolveController(SolveModel).getById('solve-123');
      expect(solve).toEqual({ id: 'solve-123' });
    });

    it('returns a cached solve without hitting the database twice', async () => {
      const SolveModel = createSolveModelMock({
        get: jest.fn().mockResolvedValue({
          id: 'cached',
          ownerId: 'you',
          gameId: 'game-1',
        }),
      });

      const controller = createSolveController(SolveModel);
      const first = await controller.getById('cached');
      const second = await controller.getById('cached');

      expect(first).toEqual(second);
      expect(SolveModel.get).toHaveBeenCalledTimes(1);
    });

    it('returns undefined for a solve that does not exist', async () => {
      const SolveModel = createSolveModelMock({
        get: jest.fn().mockResolvedValue(undefined),
      });

      const solve =
        await createSolveController(SolveModel).getById('nonexistent');
      expect(solve).toBeUndefined();
    });

    it('does not cache an undefined solve', async () => {
      const SolveModel = createSolveModelMock({
        get: jest.fn().mockResolvedValue(undefined),
      });

      const controller = createSolveController(SolveModel);
      await controller.getById('nonexistent');
      await controller.getById('nonexistent');

      expect(SolveModel.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('.query(queryObject): Solve[]', () => {
    it('builds and executes a query', async () => {
      const results = [{ id: 'solve-1' }, { id: 'solve-2' }];
      const SolveModel = createSolveModelMock({
        query: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(results),
        }),
      });

      const solves = await createSolveController(SolveModel).query({
        ownerId: 'user-123',
      });

      expect(solves).toEqual(results);
      expect(SolveModel.query).toHaveBeenCalledWith({
        ownerId: { eq: 'user-123' },
      });
    });

    it('caches query results', async () => {
      const results = [{ id: 'solve-1' }];
      const SolveModel = createSolveModelMock({
        query: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(results),
        }),
      });

      const controller = createSolveController(SolveModel);
      const queryInput = { ownerId: 'user-123' };

      const first = await controller.query(queryInput);
      const second = await controller.query(queryInput);

      expect(first).toEqual(second);
      expect(SolveModel.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('.create(input, context): Solve', () => {
    it('creates a solve', async () => {
      const newSolve = {
        id: 'attempt-123',
        ownerId: 'user-123',
        gameId: 'game-456',
        associationsKey: 'key1|key2',
        hopsIds: ['hop1', 'hop2'],
        length: 1,
        compositeKey: 'user-123|game-456|hop1,hop2',
      };

      const SolveModel = createSolveModelMock({
        query: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            using: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        create: jest.fn().mockResolvedValue(newSolve),
      });

      const solve = await createSolveController(SolveModel).create(
        {
          attemptId: 'attempt-123',
          game: { id: 'game-456' },
          hops: [
            { id: 'hop1', associationsKey: 'key1', createdAt: '2024-01-01' },
            { id: 'hop2', associationsKey: 'key2', createdAt: '2024-01-02' },
          ],
        },
        { ownerId: 'user-123' } as Context,
      );

      expect(solve.ownerId).toEqual('user-123');
      expect(solve.gameId).toEqual('game-456');
      expect(solve.associationsKey).toEqual('key1|key2');
      expect(solve.length).toEqual(1);
      expect(solve.compositeKey).toEqual('user-123|game-456|hop1,hop2');
      expect(SolveModel.create).toHaveBeenCalledWith(
        {
          id: 'attempt-123',
          gameId: 'game-456',
          hopsIds: ['hop1', 'hop2'],
          length: 1,
          ownerId: 'user-123',
          associationsKey: 'key1|key2',
          compositeKey: 'user-123|game-456|hop1,hop2',
        },
        { overwrite: false },
      );
    });

    it('aggregates associations keys from multiple hops', async () => {
      const SolveModel = createSolveModelMock({
        query: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            using: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        create: jest.fn().mockResolvedValue({
          id: 'attempt-456',
          associationsKey: 'key1|key2|key3',
        }),
      });

      await createSolveController(SolveModel).create(
        {
          attemptId: 'attempt-456',
          game: { id: 'game-789' },
          hops: [
            {
              id: 'hop1',
              associationsKey: 'key1|key2',
              createdAt: '2024-01-01',
            },
            {
              id: 'hop2',
              associationsKey: 'key2|key3',
              createdAt: '2024-01-02',
            },
          ],
        },
        { ownerId: 'user-456' } as Context,
      );

      expect(SolveModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          associationsKey: 'key1|key2|key3',
        }),
        { overwrite: false },
      );
    });

    it('throws error and deletes hops when duplicate solve is detected', async () => {
      const existingSolve = {
        id: 'existing-123',
        ownerId: 'user-123',
        gameId: 'game-456',
        compositeKey: 'user-123|game-456|hop1,hop2',
      };

      const SolveModel = createSolveModelMock({
        query: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            using: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([existingSolve]),
            }),
          }),
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(
        createSolveController(SolveModel).create(
          {
            attemptId: 'attempt-789',
            game: { id: 'game-456' },
            hops: [
              { id: 'hop1', associationsKey: 'key1', createdAt: '2024-01-01' },
              { id: 'hop2', associationsKey: 'key2', createdAt: '2024-01-02' },
            ],
          },
          { ownerId: 'user-123' } as Context,
        ),
      ).rejects.toThrow('Duplicate solve detected');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/hops?attemptId=attempt-789'),
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
      expect(SolveModel.create).not.toHaveBeenCalled();
    });

    it('sorts hop IDs consistently for composite key', async () => {
      const SolveModel = createSolveModelMock({
        query: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            using: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        create: jest.fn().mockResolvedValue({
          id: 'attempt-999',
          compositeKey: 'user-999|game-999|hop1,hop2,hop3',
        }),
      });

      await createSolveController(SolveModel).create(
        {
          attemptId: 'attempt-999',
          game: { id: 'game-999' },
          hops: [
            { id: 'hop3', associationsKey: 'key3', createdAt: '2024-01-03' },
            { id: 'hop1', associationsKey: 'key1', createdAt: '2024-01-01' },
            { id: 'hop2', associationsKey: 'key2', createdAt: '2024-01-02' },
          ],
        },
        { ownerId: 'user-999' } as Context,
      );

      expect(SolveModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          compositeKey: 'user-999|game-999|hop1,hop2,hop3',
        }),
        { overwrite: false },
      );
    });
  });
});
