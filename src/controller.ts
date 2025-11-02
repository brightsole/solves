import { model } from 'dynamoose';
import { LRUCache } from 'lru-cache';
import type { DBSolve, ModelType, Hop, Context } from './types';
import type { SolveQueryInput } from './generated/graphql';
import SolveSchema from './Solve.schema';
import env from './env';

const cache = new LRUCache<string, DBSolve>({
  max: 1000,
});
const queryCache = new LRUCache<string, DBSolve[]>({
  max: 100,
});

type CreateSolveInput = {
  hops: Hop[];
  game: { id: string };
  attemptId: string;
};

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

  create: async (
    { hops, game, attemptId }: CreateSolveInput,
    { ownerId }: Context,
  ) => {
    const sortedHopIds = hops
      .map((hop) => hop.id)
      .sort()
      .join(',');
    const compositeKey = `${ownerId}|${game?.id}|${sortedHopIds}`;

    const existingSolves = await SolveModel.query('compositeKey')
      .eq(compositeKey)
      .using('compositeKey')
      .exec();

    if (existingSolves.length > 0) {
      // Delete hops for this attempt since it's a duplicate
      await fetch(`${env.hopsApiUrl}/hops?attemptId=${attemptId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      throw new Error('Duplicate solve detected');
    }

    // smoosh all hop associations together into one
    // and store it as duplicated data on the solve
    const aggregateAssociationsKey = [
      ...new Set(
        hops
          .map((hop: Hop) => hop.associationsKey)
          .join('|')
          .split('|'),
      ),
    ].join('|');

    const solve = await SolveModel.create(
      {
        id: attemptId,
        gameId: game?.id,
        hopsIds: hops.map((hop: Hop) => hop.id),
        length: hops.length - 1,
        ownerId,
        associationsKey: aggregateAssociationsKey,
        compositeKey,
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
