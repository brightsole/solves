import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  HOPS_API_URL: str({
    desc: 'URL for the Hops API',
  }),
  GAMES_API_URL: str({
    desc: 'URL for the Games API',
  }),
  TABLE_NAME: str({
    desc: 'DynamoDB table name for solves',
    default: 'ABJECT_FAILURE', // keep it from hard erroring if you screw up env vars
  }),
  AWS_REGION: str({ default: 'ap-southeast-2' }),
  NODE_ENV: str({
    choices: ['development', 'test', 'production', 'staging'],
    default: 'development',
  }),
});

export default {
  region: env.AWS_REGION,
  tableName: env.TABLE_NAME,
  hopsApiUrl: env.HOPS_API_URL,
  gamesApiUrl: env.GAMES_API_URL,
  isProduction: env.NODE_ENV === 'production',
};
