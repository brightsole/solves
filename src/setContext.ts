import type { BaseContext, ContextFunction } from '@apollo/server';
import type { LambdaContextFunctionArgument, Context } from './types';
import { startController } from './itemController';

export const setContext: ContextFunction<
  [LambdaContextFunctionArgument],
  BaseContext
> = async ({ event, context }): Promise<Context> => {
  const userId = event.headers['x-user-id'];
  const itemController = startController();

  return {
    ...context,
    ownerId: userId,
    event,
    itemController,
  };
};

export default setContext;
