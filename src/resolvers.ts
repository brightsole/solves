import { GraphQLDateTime, GraphQLJSONObject } from 'graphql-scalars';
import { customAlphabet } from 'nanoid';
import type { Resolvers } from './generated/graphql';
import type { Context } from './types';

const resolvers: Resolvers<Context> = {
  Query: {
    solve: async (_parent, { id }, { solveController }) =>
      solveController.getById(id),

    solves: async (_parent, { query }, { solveController }) =>
      solveController.query(query),
  },

  Mutation: {
    createAttempt: async (_parent, { gameId }) => {
      // attempts, being sneaky, get hisk: snake language ids
      const nano = customAlphabet('hisSk_-~', 24);
      const id = `att_${nano()}`;

      return {
        id,
        gameId,
        createdAt: new Date(),
      };
    },
  },

  Solve: {
    __resolveReference: async ({ id }, { solveController }) =>
      solveController.getById(id),

    hops: async (parent, _args, _context) =>
      parent.hopsIds.map((id: string) => ({ __typename: 'Hop', id })),
  },

  DateTime: GraphQLDateTime,
  JSONObject: GraphQLJSONObject,
};

export default resolvers;
