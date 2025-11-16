import { GraphQLDateTime, GraphQLJSONObject } from 'graphql-scalars';
import { customAlphabet } from 'nanoid';
import type { Resolvers } from './generated/graphql';
import type { Context, DBSolve } from './types';
import env from './env';
import { findEdges } from './edgeFinder';

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
          headers: {
            'Content-Type': 'application/json',
            [env.authHeaderName]: env.authHeaderValue,
          },
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

    attemptHop: async (
      _parent,
      { word },
      { solveController, ownerId, gameId, attemptId },
    ) => {
      if (!ownerId || !gameId || !attemptId) {
        throw new Error('Missing required context');
      }

      const hopsResponse = await fetch(
        `${env.hopsApiUrl}/hops?attemptId=${attemptId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            [env.authHeaderName]: env.authHeaderValue,
          },
        },
      );
      const hops = hopsResponse.ok ? await hopsResponse.json() : [];
      const gameResponse = await fetch(`${env.gamesApiUrl}/games/${gameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          [env.authHeaderName]: env.authHeaderValue,
        },
      });
      const game = await gameResponse.json();

      const edges = findEdges(hops, game);
      const hopResults = await Promise.allSettled(
        edges.map((edge) =>
          fetch(`${env.hopsApiUrl}/hops`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-attempt-id': attemptId,
              'x-game-id': gameId,
              'x-owner-id': ownerId,
              [env.authHeaderName]: env.authHeaderValue,
            },
            body: JSON.stringify({ from: edge, to: word }),
          }),
        ),
      );

      const successfulResponses = hopResults.filter(
        (result) => result.status === 'fulfilled' && result.value.ok,
      );

      if (successfulResponses.length === 0) {
        throw new Error('No valid hops found');
      }

      // Parse JSON from all successful responses
      const successfulHops = await Promise.all(
        successfulResponses.map((result) =>
          (result as PromiseFulfilledResult<Response>).value.json(),
        ),
      );

      const allHops = [...hops, ...successfulHops];

      const newEdges = findEdges(allHops, game);

      if (newEdges.length === 0) {
        return solveController.create(
          { hops: allHops, game, attemptId },
          { ownerId, gameId, attemptId },
        );
      }

      // Return fake in-memory attempt record
      return {
        id: attemptId,
        gameId,
        ownerId,
        hopsIds: allHops.map((hop) => hop.id),
        associationsKey: allHops
          .map((hop) => hop.associationsKey)
          .filter(Boolean)
          .join('|'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DBSolve;
    },
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
