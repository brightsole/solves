import type { ModelType, DBSolve } from './types';
import { Query as QueryType } from 'dynamoose/dist/ItemRetriever';

type SolveModelMock = jest.Mocked<ModelType & QueryType<DBSolve>>;

let createSolveController: (typeof import('./controller'))['createSolveController'];

beforeEach(async () => {
  jest.resetModules();
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

  describe('.create(input, ownerId): Solve', () => {
    it('creates a solve', async () => {
      const newSolve = {
        id: 'new-solve',
        ownerId: 'user-123',
        gameId: 'game-456',
        associationsKey: 'assoc-101',
        hopsIds: ['hop1', 'hop2'],
      };

      const SolveModel = createSolveModelMock({
        create: jest.fn().mockResolvedValue(newSolve),
      });

      const solve = await createSolveController(SolveModel).create(
        {
          gameId: 'game-456',
          associationsKey: 'assoc-101',
          hopsIds: ['hop1', 'hop2'],
        },
        'user-123',
      );

      expect(solve).toEqual(newSolve);
      expect(SolveModel.create).toHaveBeenCalledWith(
        {
          id: expect.any(String),
          ownerId: 'user-123',
          gameId: 'game-456',
          associationsKey: 'assoc-101',
          hopsIds: ['hop1', 'hop2'],
        },
        { overwrite: false },
      );
    });

    it('throws unauthorized when creating without ownerId', async () => {
      const SolveModel = createSolveModelMock();

      await expect(
        createSolveController(SolveModel).create({
          gameId: 'game-456',
          associationsKey: 'assoc-101',
          hopsIds: ['hop1', 'hop2'],
        }),
      ).rejects.toThrow('Unauthorized');
    });
  });
});
