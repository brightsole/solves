import { SQSEvent, SQSRecord } from 'aws-lambda';
import { startController } from './controller';

export const handler = async (event: SQSEvent) => {
  const controller = startController();

  console.log(`Processing ${event.Records.length} SQS messages`);

  const results = await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      try {
        const solveData = JSON.parse(record.body);
        const { ownerId, ...solveInput } = solveData;

        const result = await controller.create(solveInput, ownerId);

        return result;
      } catch (error) {
        console.error('Failed to process SQS message:', {
          messageId: record.messageId,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }
    }),
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(
    `Processing complete: ${successful} successful, ${failed} failed`,
  );

  // If any failed, throw an error to trigger SQS retry/DLQ
  if (failed > 0) {
    const failures = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason);

    throw new Error(
      `Failed to process ${failed} messages: ${failures.join(', ')}`,
    );
  }

  return {
    statusCode: 200,
    processedCount: successful,
  };
};
