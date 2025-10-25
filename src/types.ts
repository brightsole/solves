import type { Model } from 'dynamoose/dist/Model';
import type { Item as DynamooseItem } from 'dynamoose/dist/Item';
import type {
  Context as LambdaContext,
  APIGatewayProxyEventV2,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import { createItemController } from './itemController';

export type GatewayEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

export interface LambdaContextFunctionArgument {
  event: GatewayEvent;
  context: LambdaContext;
}

export type DBItem = DynamooseItem & {
  id: string;
  ownerId: string;
  name?: string | null;
  description?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type ModelType = Model<DBItem>;

export type Context = {
  itemController: ReturnType<typeof createItemController>;
  ownerId?: string;
  event: unknown;
};
