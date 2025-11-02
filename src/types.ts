import type { Model } from 'dynamoose/dist/Model';
import type { Item as DynamooseItem } from 'dynamoose/dist/Item';
import type {
  Context as LambdaContext,
  APIGatewayProxyEventV2,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import { createSolveController } from './controller';

export type GatewayEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

export interface LambdaContextFunctionArgument {
  event: GatewayEvent;
  context: LambdaContext;
}

export type DBSolve = DynamooseItem & {
  id: string;
  ownerId: string;
  gameId: string;
  associationsKey: string;
  length: number;
  isFinished: boolean;
  hopsIds: string[];
  compositeKey: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};
export type ModelType = Model<DBSolve>;

export type Context = {
  solveController: ReturnType<typeof createSolveController>;
  attemptId?: string;
  ownerId?: string;
  gameId?: string;
  event: unknown;
};

export type Hop = {
  id: string;
  associationsKey: string;
  createdAt: string;
};
