import { gql } from 'graphql-tag';

export default gql`
  scalar DateTime
  scalar JSONObject

  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable", "@external"]
    )

  type Hop @key(fields: "id") @external {
    id: ID!
  }
  type Game @key(fields: "id") @external {
    id: ID!
  }

  type Solve @key(fields: "id") {
    id: ID!
    ownerId: String # TODO: change to User once users is done
    game: Game
    associationsKey: String
    hops: [Hop!]!
    createdAt: DateTime
    updatedAt: DateTime
  }

  input SolveQueryInput {
    associationsKey: String
    ownerId: String
    gameId: String
  }

  type Query {
    solve(id: ID!): Solve
    solves(query: SolveQueryInput!): [Solve]
  }

  type Mutation {
    startAttempt(gameId: ID!, previousAttemptId: ID): Solve
    attemptHop(word: ID!): Solve
  }
`;
