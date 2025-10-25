import { startController } from './itemController';
import resolvers from './resolvers';
import type { DBItem } from './types';

const defaultItem = {
  id: 'niner',
  ownerId: 'owner',
  name: 'Niner',
  description: 'My favorite number',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
} as unknown as DBItem;

type ResolverFunction = (
  parent: unknown,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: unknown,
) => unknown;

const callResolver = async (
  resolver: unknown,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
) => {
  if (!resolver) throw new Error('Resolver is undefined');
  const fn = resolver as ResolverFunction;
  return fn(undefined, args, context, undefined);
};

const createItemControllerMock = (
  overrides: Partial<ReturnType<typeof startController>> = {},
): ReturnType<typeof startController> => ({
  getById: jest.fn().mockResolvedValue(undefined),
  listByOwner: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(defaultItem),
  update: jest.fn().mockResolvedValue(defaultItem),
  remove: jest.fn().mockResolvedValue({ ok: true }),
  ...overrides,
});

const Query = resolvers.Query!;
const Mutation = resolvers.Mutation!;

describe('Resolvers', () => {
  describe('Query', () => {
    it('fetches an item given an id', async () => {
      const itemController = createItemControllerMock({
        getById: jest.fn().mockResolvedValue(defaultItem),
      });

      const item = await callResolver(
        Query.item,
        { id: 'niner' },
        { itemController, event: {} },
      );

      expect(item).toEqual(defaultItem);
      expect(itemController.getById).toHaveBeenCalledWith('niner');
    });

    it('returns null for an unknown item', async () => {
      const itemController = createItemControllerMock({
        getById: jest.fn().mockResolvedValue(undefined),
      });

      const item = await callResolver(
        Query.item,
        { id: 'niner' },
        { itemController, event: {} },
      );
      expect(item).toBeUndefined();
    });

    it('lists items for an owner', async () => {
      const results = [
        {
          id: 'niner',
          ownerId: 'you',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-03T00:00:00.000Z'),
        },
        {
          id: 'five',
          ownerId: 'you',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-03T00:00:00.000Z'),
        },
      ].map((item) => ({ ...defaultItem, ...item })) as unknown as DBItem[];

      const itemController = createItemControllerMock({
        listByOwner: jest.fn().mockResolvedValue(results),
      });

      const items = await callResolver(
        Query.items,
        { query: { ownerId: 'you' } },
        { itemController, event: {} },
      );

      expect(items).toEqual(results);
      expect(itemController.listByOwner).toHaveBeenCalledWith('you');
    });
  });

  describe('Mutation', () => {
    it('creates an item when given valid data', async () => {
      const create = jest.fn().mockResolvedValue(defaultItem);
      const itemController = createItemControllerMock({ create });

      const item = await callResolver(
        Mutation.createItem,
        { name: 'Niner', description: 'My favorite number' },
        { itemController, event: {}, ownerId: 'yourself' },
      );

      expect(item).toEqual(defaultItem);
      expect(create).toHaveBeenCalledWith(
        { name: 'Niner', description: 'My favorite number' },
        'yourself',
      );
    });

    it('propagates create errors', async () => {
      const create = jest.fn().mockRejectedValue(new Error('Unauthorized'));
      const itemController = createItemControllerMock({ create });

      await expect(
        callResolver(
          Mutation.createItem,
          { name: 'Niner', description: 'My favorite number' },
          { itemController, event: {} },
        ),
      ).rejects.toThrow('Unauthorized');
    });

    it('updates an item when given valid data', async () => {
      const update = jest.fn().mockResolvedValue(defaultItem);
      const itemController = createItemControllerMock({ update });

      const item = await callResolver(
        Mutation.updateItem,
        {
          input: {
            id: 'niner',
            name: 'Niner',
            description: 'My favorite number',
          },
        },
        { itemController, event: {}, ownerId: 'yourself' },
      );

      expect(item).toEqual(defaultItem);
      expect(update).toHaveBeenCalledWith(
        {
          id: 'niner',
          name: 'Niner',
          description: 'My favorite number',
        },
        'yourself',
      );
    });

    it('propagates update errors', async () => {
      const update = jest
        .fn()
        .mockRejectedValue(new Error('Item deleted or owned by another user'));
      const itemController = createItemControllerMock({ update });

      await expect(
        callResolver(
          Mutation.updateItem,
          {
            input: {
              id: 'niner',
              name: 'Niner',
              description: 'My favorite number',
            },
          },
          { itemController, event: {}, ownerId: 'yourself' },
        ),
      ).rejects.toThrow('Item deleted or owned by another user');
    });

    it('deletes an item when given valid data', async () => {
      const remove = jest.fn().mockResolvedValue({ ok: true });
      const itemController = createItemControllerMock({ remove });

      await expect(
        callResolver(
          Mutation.deleteItem,
          { id: 'niner' },
          { itemController, event: {}, ownerId: 'yourself' },
        ),
      ).resolves.toEqual({ ok: true });

      expect(remove).toHaveBeenCalledWith('niner', 'yourself');
    });

    it('propagates delete errors', async () => {
      const remove = jest
        .fn()
        .mockRejectedValue(new Error('Conditional check failed'));
      const itemController = createItemControllerMock({ remove });

      await expect(
        callResolver(
          Mutation.deleteItem,
          { id: 'niner' },
          { itemController, event: {}, ownerId: 'yourself' },
        ),
      ).rejects.toThrow('Conditional check failed');
    });
  });
});
