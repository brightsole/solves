import type { BaseContext, ContextFunction } from '@apollo/server';
import type { LambdaContextFunctionArgument, Context } from './types';
import { startController } from './controller';

export const setContext: ContextFunction<
  [LambdaContextFunctionArgument],
  BaseContext
> = async ({ event, context }): Promise<Context> => {
  const userId = event.headers['x-user-id'];
  const gameId = event.headers['x-game-id'];
  const attemptId = event.headers['x-attempt-id'];
  const solveController = startController();

  return {
    ...context,
    ownerId: userId,
    gameId,
    attemptId,
    event,
    solveController,
  };
};

export default setContext;
