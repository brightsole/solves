import type { BaseContext, ContextFunction } from '@apollo/server';
import type { LambdaContextFunctionArgument, Context } from './types';
import { startController } from './controller';

export const setContext: ContextFunction<
  [LambdaContextFunctionArgument],
  BaseContext
> = async ({ event, context }): Promise<Context> => {
  const userId = event.headers['x-user-id'];
  const solveController = startController();

  return {
    ...context,
    ownerId: userId,
    event,
    solveController,
  };
};

export default setContext;
