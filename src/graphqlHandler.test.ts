import { gql } from 'graphql-tag';
import { nanoid } from 'nanoid';
import getGraphqlServer from '../test/getGraphqlServer';

// INTEGRATION TEST OF THE FULL PATH
// only test for completion of high level access
// correct low level unit testing should be done on the resolver/util level

describe('Resolver full path', () => {
  it('queries solves without error', async () => {
    const server = getGraphqlServer();

    const solvesQuery = gql`
      query Solves($query: SolveQueryInput!) {
        solves(query: $query) {
          id
          ownerId
          gameId
        }
      }
    `;

    const query = jest.fn();
    const solveController = {
      query,
      getById: jest.fn(),
      create: jest.fn(),
    };

    const ownerId = 'that guy who makes things';

    query.mockResolvedValueOnce([
      {
        id: nanoid(),
        ownerId,
        gameId: 'game123',
        associationsKey: 'assoc123',
        hopsIds: ['hop1', 'hop2'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { body } = await server.executeOperation(
      {
        query: solvesQuery,
        variables: {
          query: { ownerId },
        },
      },
      {
        contextValue: {
          ownerId,
          solveController,
        },
      },
    );

    if (body.kind !== 'single') {
      throw new Error('Expected a single GraphQL response');
    }

    const { singleResult } = body;

    expect(singleResult.errors).toBeUndefined();
    expect(singleResult.data).toEqual({
      solves: [
        {
          id: expect.any(String),
          ownerId,
          gameId: 'game123',
        },
      ],
    });
    expect(query).toHaveBeenCalledWith({ ownerId });
  });
});
