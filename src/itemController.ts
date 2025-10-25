import { Condition, model } from 'dynamoose';
import { nanoid } from 'nanoid';
import { LRUCache } from 'lru-cache';
import type {
  MutationCreateItemArgs,
  UpdateItemInput,
} from './generated/graphql';
import type { DBItem, ModelType } from './types';
import ItemSchema from './Item.schema';
import env from './env';

const cache = new LRUCache<string, DBItem>({
  max: 1000,
});

export const createItemController = (ItemModel: ModelType) => ({
  getById: async (id: string) => {
    const cachedItem = cache.get(id);
    if (cachedItem) return cachedItem;

    const item = await ItemModel.get(id);
    if (item) cache.set(id, item);
    return item;
  },

  listByOwner: (ownerId?: string | null) =>
    ItemModel.query('ownerId').eq(ownerId).using('ownerId').exec(),

  create: async (
    input: Pick<MutationCreateItemArgs, 'name' | 'description'>,
    ownerId?: string,
  ) => {
    if (!ownerId) throw new Error('Unauthorized');
    const item = await ItemModel.create(
      {
        id: nanoid(),
        ownerId,
        ...input,
      },
      {
        overwrite: false,
      },
    );
    cache.set(item.id, item);
    return item;
  },

  update: async (input: UpdateItemInput, ownerId?: string) => {
    const { id, ...rest } = input;

    const updatedItem = await ItemModel.update(
      { id },
      { ...rest, ownerId },
      {
        condition: new Condition()
          .where('ownerId')
          .eq(ownerId)
          .and()
          .attribute('id')
          .exists(),
        returnValues: 'ALL_NEW',
      },
    );
    if (updatedItem?.id) cache.set(updatedItem.id, updatedItem);
    return updatedItem;
  },

  remove: async (id: string, ownerId?: string) => {
    await ItemModel.delete(id, {
      condition: new Condition().where('ownerId').eq(ownerId),
    });

    cache.delete(id);
    return { ok: true };
  },
});

export const startController = () => {
  const itemModel = model<DBItem>(env.tableName, ItemSchema);

  return createItemController(itemModel);
};
