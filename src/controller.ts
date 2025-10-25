import { model } from 'dynamoose';
import { nanoid } from 'nanoid';
import { LRUCache } from 'lru-cache';
import type { DBSolve, ModelType } from './types';
import type { SolveQueryInput } from './generated/graphql';
import SolveSchema from './Solve.schema';
import env from './env';

const cache = new LRUCache<string, DBSolve>({
  max: 1000,
});
const queryCache = new LRUCache<string, DBSolve[]>({
  max: 100,
});

export const createSolveController = (SolveModel: ModelType) => ({
  getById: async (id: string) => {
    const cachedSolve = cache.get(id);
    if (cachedSolve) return cachedSolve;

    const solve = await SolveModel.get(id);
    if (solve) cache.set(id, solve);
    return solve;
  },

  query: async (queryObject: SolveQueryInput) => {
    const builtQuery = Object.entries(queryObject).reduce(
      (acc, [key, value]) => {
        // also, these act as a filter. other properties are ignored
        if (value === undefined) return acc;

        if (['ownerId', 'gameId'].includes(key))
          return { ...acc, [key]: { eq: value } };

        if (['associationsKey'].includes(key))
          return { ...acc, [key]: { contains: value } };

        return acc;
      },
      {},
    );

    const key = JSON.stringify(builtQuery);
    const cached = queryCache.get(key);
    if (cached) return Promise.resolve(cached);

    const results = await SolveModel.query(builtQuery).exec();

    queryCache.set(key, results);
    return results;
  },

  create: async (input: Partial<DBSolve>, ownerId?: string) => {
    if (!ownerId) throw new Error('Unauthorized');
    const solve = await SolveModel.create(
      {
        id: nanoid(),
        ownerId,
        ...input,
      },
      {
        overwrite: false,
      },
    );
    cache.set(solve.id, solve);
    return solve;
  },

  // no mutations
  // no deletions
});

export const startController = () => {
  const solveModel = model<DBSolve>(env.tableName, SolveSchema);

  return createSolveController(solveModel);
};
