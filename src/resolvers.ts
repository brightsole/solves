import { GraphQLDateTime, GraphQLJSONObject } from 'graphql-scalars';
import { customAlphabet } from 'nanoid';
import type { Resolvers } from './generated/graphql';
import type { Context, DBSolve } from './types';
import env from './env';

const resolvers: Resolvers<Context> = {
  Query: {
    solve: (_parent, { id }, { solveController }) =>
      solveController.getById(id),

    solves: (_parent, { query }, { solveController }) =>
      solveController.query(query),
  },

  Mutation: {
    startAttempt: async (
      _parent,
      { gameId, previousAttemptId },
      { ownerId },
    ) => {
      // attempts, being sneaky, get hisk: snake language ids
      // 1000 ids a second should be 1k years before collision
      // and longer because we only store solves
      const nano = customAlphabet('hisSk_-~', 24);
      const id = nano();

      if (previousAttemptId) {
        // If there is a previous attempt, we can clean old hops
        await fetch(`${env.hopsApiUrl}/hops?attemptId=${previousAttemptId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return Promise.resolve({
        id,
        gameId,
        ownerId: ownerId,
        hopsIds: [],
        associationsKey: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as DBSolve);
      // gql expects a whole load of db shit, but attempts live in memory
    },

    // attemptHop: (_parent, { word }, { solveController, attemptId, ownerId }) => {
    // }
  },

  Solve: {
    __resolveReference: ({ id }, { solveController }) =>
      solveController.getById(id),

    game: (parent) => ({ __typename: 'Game', id: parent.gameId }),

    hops: (parent) =>
      parent.hopsIds.map((id: string) => ({ __typename: 'Hop', id })),
  },

  DateTime: GraphQLDateTime,
  JSONObject: GraphQLJSONObject,
};

export default resolvers;
