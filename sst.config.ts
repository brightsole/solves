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
    const solvesTable = new sst.aws.Dynamo('Solves', {
      fields: {
        id: 'string',
        length: 'number',
        gameId: 'string',
        ownerId: 'string',
        compositeKey: 'string',
        associationsKey: 'string',
      },
      primaryIndex: { hashKey: 'id' },
      globalIndexes: {
        gameId: { hashKey: 'gameId' },
        length: { hashKey: 'length' },
        ownerId: { hashKey: 'ownerId' },
        compositeKey: { hashKey: 'compositeKey' },
        associationsKey: { hashKey: 'associationsKey' },
      },
      deletionProtection: $app.stage === 'production',
    });

    const internalAuth = await aws.secretsmanager.getSecretVersionOutput({
      secretId: `jumpingbeen/${$app.stage}/internal-lockdown`,
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
    const hopsApiUrl = await aws.ssm.getParameter({
      name: `/sst/words-service/${$app.stage}/api-url`,
    });
    const gamesApiUrl = await aws.ssm.getParameter({
      name: `/sst/games-service/${$app.stage}/api-url`,
    });

    const authSecrets = internalAuth.secretString.apply((s) => JSON.parse(s!));

    const functionConfig = {
      runtime: 'nodejs22.x' as const,
      timeout: '20 seconds' as const,
      memory: '1024 MB' as const,
      nodejs: {
        format: 'esm' as const,
      },
      environment: {
        TABLE_NAME: solvesTable.name,
        HOPS_API_URL: hopsApiUrl.value,
        GAMES_API_URL: gamesApiUrl.value,
        INTERNAL_SECRET_HEADER_NAME: authSecrets.apply(
          (v) => v.INTERNAL_SECRET_HEADER_NAME,
        ),
        INTERNAL_SECRET_HEADER_VALUE: authSecrets.apply(
          (v) => v.INTERNAL_SECRET_HEADER_VALUE,
        ),
      },
    };

    api.route('ANY /graphql', {
      ...functionConfig,
      handler: 'src/graphqlHandler.handler',
    });

    // no rest routes; this is all for the users

    return {
      graphUrl: api.url.apply((url) => `${url}/graphql`),
      solvesTableName: solvesTable.name,
    };
  },
});
