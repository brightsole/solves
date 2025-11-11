import resolvers from './resolvers';
import type { Context, Hop, Game } from './types';
import type { GraphQLResolveInfo } from 'graphql';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Type helper to extract resolver function
type ResolverFn = (
  parent: Record<PropertyKey, never>,
  args: { word: string },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<unknown>;

describe('attemptHop resolver', () => {
  const mockOwnerId = 'owner123';
  const mockGameId = 'game456';
  const mockAttemptId = 'attempt789';

  const mockGame: Game = {
    id: mockGameId,
    words: ['start', 'end'],
  };

  const mockExistingHops: Hop[] = [
    {
      id: 'hop1',
      from: 'start',
      to: 'middle',
      linkKey: 'start::middle',
      associationsKey: 'assoc1',
      createdAt: '2025-11-02T10:00:00Z',
    },
  ];

  const mockSolveController = {
    getById: jest.fn(),
    query: jest.fn(),
    create: jest.fn(),
  };

  const mockContext: Context = {
    ownerId: mockOwnerId,
    gameId: mockGameId,
    attemptId: mockAttemptId,
    solveController: mockSolveController,
    event: {},
  };

  const attemptHop = resolvers.Mutation!.attemptHop as ResolverFn;
  const mockInfo = {} as GraphQLResolveInfo;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('throws error when ownerId is missing', async () => {
    const context: Context = {
      ...mockContext,
      ownerId: undefined,
    };

    await expect(
      attemptHop({}, { word: 'test' }, context, mockInfo),
    ).rejects.toThrow('Missing required context');
  });

  it('throws error when gameId is missing', async () => {
    const context: Context = {
      ...mockContext,
      gameId: undefined,
    };

    await expect(
      attemptHop({}, { word: 'test' }, context, mockInfo),
    ).rejects.toThrow('Missing required context');
  });

  it('throws error when attemptId is missing', async () => {
    const context: Context = {
      ...mockContext,
      attemptId: undefined,
    };

    await expect(
      attemptHop({}, { word: 'test' }, context, mockInfo),
    ).rejects.toThrow('Missing required context');
  });

  it('throws error when no valid hops are found', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockExistingHops,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGame,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

    await expect(
      attemptHop({}, { word: 'invalid' }, mockContext, mockInfo),
    ).rejects.toThrow('No valid hops found');
  });

  it('returns in-memory attempt when hop is successful but puzzle incomplete', async () => {
    const mockNewHop = {
      id: 'hop2',
      from: 'middle',
      to: 'destination',
      linkKey: 'middle::destination',
      associationsKey: 'assoc2',
      createdAt: '2025-11-02T10:05:00Z',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockExistingHops,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGame,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewHop,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewHop,
      } as Response);

    const result = await attemptHop(
      {},
      { word: 'destination' },
      mockContext,
      mockInfo,
    );

    expect(result).toBeDefined();
    expect(result).toMatchObject({
      id: mockAttemptId,
      gameId: mockGameId,
      ownerId: mockOwnerId,
    });
    expect((result as { hopsIds: string[] }).hopsIds).toHaveLength(3);
    expect((result as { hopsIds: string[] }).hopsIds).toContain('hop1');
    expect((result as { hopsIds: string[] }).hopsIds).toContain('hop2');
    expect((result as { associationsKey: string }).associationsKey).toContain(
      'assoc1',
    );
    expect((result as { associationsKey: string }).associationsKey).toContain(
      'assoc2',
    );
    expect(mockSolveController.create).not.toHaveBeenCalled();
  });

  it('creates solve when puzzle is complete (no edges remaining)', async () => {
    const twoWordGame: Game = {
      id: mockGameId,
      words: ['start', 'end'],
    };

    // No existing hops, but the word we're hopping to closes the loop
    const noHops: Hop[] = [];

    const newHop: Hop = {
      id: 'hop1',
      from: 'start',
      to: 'completingWord',
      linkKey: 'start::end',
      associationsKey: 'assoc1',
      createdAt: '2025-11-02T10:00:00Z',
    };

    const mockSolve = {
      id: mockAttemptId,
      gameId: mockGameId,
      ownerId: mockOwnerId,
      hopsIds: ['hop1'],
      length: 0,
      associationsKey: 'assoc1',
      compositeKey: `${mockOwnerId}|${mockGameId}|hop1`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSolveController.create.mockResolvedValue(mockSolve);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => noHops,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => twoWordGame,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => newHop,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => newHop,
      } as Response);

    const result = await attemptHop(
      {},
      { word: 'completingWord' },
      mockContext,
      mockInfo,
    );

    expect(mockSolveController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: mockAttemptId,
        game: twoWordGame,
      }),
      expect.objectContaining({
        ownerId: mockOwnerId,
        gameId: mockGameId,
        attemptId: mockAttemptId,
      }),
    );
    expect(result).toEqual(mockSolve);
  });

  it('attempts all edges and combines successful hops', async () => {
    const threeWordGame: Game = {
      id: mockGameId,
      words: ['a', 'b', 'c'],
    };

    const noHops: Hop[] = [];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => noHops,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => threeWordGame,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'hop1',
          from: 'a',
          to: 'test',
          linkKey: 'a::test',
          associationsKey: 'assoc1',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'hop2',
          from: 'c',
          to: 'test',
          linkKey: 'c::test',
          associationsKey: 'assoc2',
        }),
      } as Response);

    const result = await attemptHop(
      {},
      { word: 'test' },
      mockContext,
      mockInfo,
    );

    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect((result as { hopsIds: string[] }).hopsIds).toHaveLength(2);
    expect((result as { associationsKey: string }).associationsKey).toContain(
      'assoc1',
    );
    expect((result as { associationsKey: string }).associationsKey).toContain(
      'assoc2',
    );
  });

  it('fetches hops and game with correct URLs', async () => {
    const mockHop = {
      id: 'hop1',
      from: 'start',
      to: 'test',
      linkKey: 'start::test',
      associationsKey: 'assoc1',
      createdAt: '2025-11-02T10:00:00Z',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGame,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHop,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHop,
      } as Response);

    await attemptHop({}, { word: 'test' }, mockContext, mockInfo);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/hops?attemptId=${mockAttemptId}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/games/${mockGameId}`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends correct headers when creating hops', async () => {
    const mockHop = {
      id: 'hop1',
      from: 'start',
      to: 'test',
      linkKey: 'start::test',
      associationsKey: 'assoc1',
      createdAt: '2025-11-02T10:00:00Z',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGame,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHop,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHop,
      } as Response);

    await attemptHop({}, { word: 'test' }, mockContext, mockInfo);

    const hopCreationCalls = mockFetch.mock.calls.filter((call) =>
      call[0]?.toString().endsWith('/hops'),
    );

    hopCreationCalls.forEach((call) => {
      const options = call[1] as RequestInit;
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual(
        expect.objectContaining({
          'x-attempt-id': mockAttemptId,
          'x-game-id': mockGameId,
          'x-owner-id': mockOwnerId,
          [process.env.INTERNAL_SECRET_HEADER_NAME!]:
            process.env.INTERNAL_SECRET_HEADER_VALUE!,
        }),
      );
    });
  });
});
