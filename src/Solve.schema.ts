import { Schema } from 'dynamoose';

export default new Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: { name: 'ownerId', type: 'global' },
    },
    id: { type: String, hashKey: true, required: true },
    length: {
      type: Number,
      required: true,
      index: { name: 'length', type: 'global' },
    },
    gameId: { type: String, required: true },
    associationsKey: {
      type: String,
      required: true,
      index: { name: 'associationsKey', type: 'global' },
    },
    hopsIds: { type: Array, schema: [String], required: true },
  },
  { timestamps: true },
);
