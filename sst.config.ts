/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'solves-service',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: input?.stage === 'production',
      home: 'aws',
    };
  },
  async run() {
    const queue = new sst.aws.Queue('solves-queue', { fifo: true });
    const solvesTable = new sst.aws.Dynamo('Solves', {
      fields: {
        id: 'string',
        gameId: 'string',
        ownerId: 'string',
        associationsKey: 'string',
      },
      primaryIndex: { hashKey: 'id' },
      globalIndexes: {
        gameId: { hashKey: 'gameId' },
        ownerId: { hashKey: 'ownerId' },
        associationsKey: { hashKey: 'associationsKey' },
      },
      deletionProtection: $app.stage === 'production',
    });

    const api = new sst.aws.ApiGatewayV2('Api', {
      link: [solvesTable],
    });

    // new sst.aws.Cron('KeepWarmCron', {
    //   // every 5 minutes, roughly 8am to 6pm, Mon-Fri, Australia/Sydney time
    //   // keeps it warm at all times during business hours
    //   schedule: 'cron(*/5 21-23,0-8 ? * SUN-FRI *)',
    //   job: {
    //     handler: 'src/keepWarm.handler',
    //     environment: {
    //       PING_URL: api.url,
    //     },
    //   },
    // });

    new aws.ssm.Parameter('SolvesApiUrl', {
      name: `/sst/${$app.name}/${$app.stage}/api-url`,
      type: 'String',
      value: api.url,
      description: `API Gateway URL for ${$app.name} ${$app.stage}`,
    });
    new aws.ssm.Parameter('SolvesQueueUrl', {
      name: `/sst/${$app.name}/${$app.stage}/queue-url`,
      type: 'String',
      value: queue.url,
      description: `SQS Queue URL for ${$app.name} ${$app.stage}`,
    });

    api.route('ANY /graphql', {
      runtime: 'nodejs22.x',
      timeout: '20 seconds',
      memory: '1024 MB',
      nodejs: {
        format: 'esm',
      },
      environment: {
        TABLE_NAME: solvesTable.name,
      },
      handler: 'src/graphqlHandler.handler',
    });

    queue.subscribe({
      handler: 'src/queueHandler.handler',
      runtime: 'nodejs22.x',
      memory: '1024 MB',
      nodejs: {
        format: 'esm',
      },
      timeout: '30 seconds',
      environment: {
        TABLE_NAME: solvesTable.name,
      },
    });

    return {
      apiUrl: api.url,
      queueUrl: queue.url,
      solvesTableName: solvesTable.name,
    };
  },
});
