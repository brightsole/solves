import { GraphQLDateTime, GraphQLJSONObject } from 'graphql-scalars';
import type { Resolvers } from './generated/graphql';
import type { Context } from './types';

const resolvers: Resolvers<Context> = {
  Query: {
    item: async (_parent, { id }, { itemController }) =>
      itemController.getById(id),
    // for extra security, we could ignore the props passed in, and instead only grab items that belong to
    // the ownerId passed in the headers. This could also be overly limiting if items aren't private
    items: async (_parent, { query: { ownerId } }, { itemController }) =>
      itemController.listByOwner(ownerId),
  },

  Mutation: {
    createItem: async (
      _parent,
      { name, description },
      { ownerId, itemController },
    ) => itemController.create({ name, description }, ownerId),

    updateItem: async (_parent, { input }, { ownerId, itemController }) =>
      itemController.update(input, ownerId),

    deleteItem: async (_parent, { id }, { ownerId, itemController }) =>
      itemController.remove(id, ownerId),
  },

  Item: {
    // for finding out the info of the other items in the system
    __resolveReference: async ({ id }, { itemController }) =>
      itemController.getById(id),
  },

  DateTime: GraphQLDateTime,
  JSONObject: GraphQLJSONObject,
};

export default resolvers;
