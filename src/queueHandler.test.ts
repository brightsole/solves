import { SQSEvent, SQSRecord } from 'aws-lambda';
import { handler } from './queueHandler';
import { startController } from './controller';

// Mock the controller
jest.mock('./controller');
const mockStartController = startController as jest.MockedFunction<
  typeof startController
>;

describe('Queue Handler', () => {
  let mockController: {
    create: jest.Mock;
    getById: jest.Mock;
    query: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockController = {
      create: jest.fn(),
      getById: jest.fn(),
      query: jest.fn(),
    };
    mockStartController.mockReturnValue(mockController);
  });

  const createSQSEvent = (records: Partial<SQSRecord>[]): SQSEvent => ({
    Records: records.map(
      (record) =>
        ({
          messageId: 'test-message-id',
          receiptHandle: 'test-receipt-handle',
          body: '{}',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1545082649183',
            SenderId: 'AIDAIENQZJOLO23YVJ4VO',
            ApproximateFirstReceiveTimestamp: '1545082649185',
          },
          messageAttributes: {},
          md5OfBody: 'test-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
          awsRegion: 'us-east-1',
          ...record,
        }) as SQSRecord,
    ),
  });

  describe('successful processing', () => {
    it('processes a single solve creation message', async () => {
      const solveData = {
        ownerId: 'user-123',
        gameId: 'game-456',
        associationsKey: 'assoc-789',
        hopsIds: ['hop1', 'hop2', 'hop3'],
      };

      const createdSolve = {
        id: 'solve-123',
        ...solveData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockController.create.mockResolvedValue(createdSolve);

      const event = createSQSEvent([
        {
          messageId: 'msg-1',
          body: JSON.stringify(solveData),
        },
      ]);

      const result = await handler(event);

      expect(result).toEqual({
        statusCode: 200,
        processedCount: 1,
      });

      expect(mockController.create).toHaveBeenCalledWith(
        {
          gameId: 'game-456',
          associationsKey: 'assoc-789',
          hopsIds: ['hop1', 'hop2', 'hop3'],
        },
        'user-123',
      );
    });

    it('processes multiple solve creation messages', async () => {
      const solveData1 = {
        ownerId: 'user-1',
        gameId: 'game-1',
        associationsKey: 'assoc-1',
        hopsIds: ['hop1'],
      };

      const solveData2 = {
        ownerId: 'user-2',
        gameId: 'game-2',
        associationsKey: 'assoc-2',
        hopsIds: ['hop2', 'hop3'],
      };

      mockController.create
        .mockResolvedValueOnce({
          id: 'solve-1',
          ...solveData1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'solve-2',
          ...solveData2,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const event = createSQSEvent([
        {
          messageId: 'msg-1',
          body: JSON.stringify(solveData1),
        },
        {
          messageId: 'msg-2',
          body: JSON.stringify(solveData2),
        },
      ]);

      const result = await handler(event);

      expect(result).toEqual({
        statusCode: 200,
        processedCount: 2,
      });

      expect(mockController.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('lets Dynamoose handle validation when ownerId is missing', async () => {
      const invalidData = {
        gameId: 'game-456',
        associationsKey: 'assoc-789',
        hopsIds: ['hop1'],
        // Missing ownerId - Dynamoose will handle this
      };

      // Mock Dynamoose validation error
      mockController.create.mockRejectedValue(new Error('Unauthorized'));

      const event = createSQSEvent([
        {
          messageId: 'msg-1',
          body: JSON.stringify(invalidData),
        },
      ]);

      await expect(handler(event)).rejects.toThrow(
        'Failed to process 1 messages',
      );

      // Should still call create, but Dynamoose/controller will reject
      expect(mockController.create).toHaveBeenCalledWith(
        {
          gameId: 'game-456',
          associationsKey: 'assoc-789',
          hopsIds: ['hop1'],
        },
        undefined, // ownerId is undefined
      );
    });

    it('lets Dynamoose handle validation when required fields are missing', async () => {
      const invalidData = {
        ownerId: 'user-123',
        gameId: 'game-456',
        // Missing associationsKey and hopsIds - Dynamoose will handle this
      };

      // Mock Dynamoose validation error
      mockController.create.mockRejectedValue(
        new Error('ValidationError: Path `associationsKey` is required.'),
      );

      const event = createSQSEvent([
        {
          messageId: 'msg-1',
          body: JSON.stringify(invalidData),
        },
      ]);

      await expect(handler(event)).rejects.toThrow(
        'Failed to process 1 messages',
      );

      // Should call create with partial data, Dynamoose will validate
      expect(mockController.create).toHaveBeenCalledWith(
        {
          gameId: 'game-456',
        },
        'user-123',
      );
    });

    it('throws error when JSON parsing fails', async () => {
      const event = createSQSEvent([
        {
          messageId: 'msg-1',
          body: 'invalid-json',
        },
      ]);

      await expect(handler(event)).rejects.toThrow(
        'Failed to process 1 messages',
      );

      expect(mockController.create).not.toHaveBeenCalled();
    });

    it('throws error when database creation fails', async () => {
      const solveData = {
        ownerId: 'user-123',
        gameId: 'game-456',
        associationsKey: 'assoc-789',
        hopsIds: ['hop1'],
      };

      mockController.create.mockRejectedValue(new Error('Database error'));

      const event = createSQSEvent([
        {
          messageId: 'msg-1',
          body: JSON.stringify(solveData),
        },
      ]);

      await expect(handler(event)).rejects.toThrow(
        'Failed to process 1 messages',
      );

      expect(mockController.create).toHaveBeenCalledWith(
        {
          gameId: 'game-456',
          associationsKey: 'assoc-789',
          hopsIds: ['hop1'],
        },
        'user-123',
      );
    });

    it('handles partial failures in batch processing', async () => {
      const validData = {
        ownerId: 'user-1',
        gameId: 'game-1',
        associationsKey: 'assoc-1',
        hopsIds: ['hop1'],
      };

      const invalidData = {
        ownerId: 'user-2',
        gameId: 'game-2',
        // Missing required fields - will be passed to controller, but controller will reject
      };

      mockController.create
        .mockResolvedValueOnce({
          id: 'solve-1',
          ...validData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockRejectedValueOnce(
          new Error('ValidationError: Path `associationsKey` is required.'),
        );

      const event = createSQSEvent([
        {
          messageId: 'msg-1',
          body: JSON.stringify(validData),
        },
        {
          messageId: 'msg-2',
          body: JSON.stringify(invalidData),
        },
      ]);

      await expect(handler(event)).rejects.toThrow(
        'Failed to process 1 messages',
      );

      // Both messages should be attempted (we no longer pre-validate)
      expect(mockController.create).toHaveBeenCalledTimes(2);
    });
  });
});
