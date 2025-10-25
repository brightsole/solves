import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { DBSolve, Context } from '../types';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
  JSONObject: { input: Record<string, unknown>; output: Record<string, unknown>; }
  _FieldSet: { input: any; output: any; }
};

export type Attempt = {
  __typename?: 'Attempt';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  gameId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
};

export type Hop = {
  __typename?: 'Hop';
  id: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createAttempt?: Maybe<Attempt>;
};


export type MutationCreateAttemptArgs = {
  gameId: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  solve?: Maybe<Solve>;
  solves?: Maybe<Array<Maybe<Solve>>>;
};


export type QuerySolveArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySolvesArgs = {
  query: SolveQueryInput;
};

export type Solve = {
  __typename?: 'Solve';
  associationsKey?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  gameId?: Maybe<Scalars['String']['output']>;
  hops: Array<Hop>;
  id: Scalars['ID']['output'];
  ownerId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type SolveQueryInput = {
  associationsKey?: InputMaybe<Scalars['String']['input']>;
  gameId?: InputMaybe<Scalars['String']['input']>;
  ownerId?: InputMaybe<Scalars['String']['input']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ReferenceResolver<TResult, TReference, TContext> = (
      reference: TReference,
      context: TContext,
      info: GraphQLResolveInfo
    ) => Promise<TResult> | TResult;

      type ScalarCheck<T, S> = S extends true ? T : NullableCheck<T, S>;
      type NullableCheck<T, S> = Maybe<T> extends T ? Maybe<ListCheck<NonNullable<T>, S>> : ListCheck<T, S>;
      type ListCheck<T, S> = T extends (infer U)[] ? NullableCheck<U, S>[] : GraphQLRecursivePick<T, S>;
      export type GraphQLRecursivePick<T, S> = { [K in keyof T & keyof S]: ScalarCheck<T[K], S[K]> };
    

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping of federation types */
export type FederationTypes = {
  Hop: Hop;
  Solve: Solve;
};

/** Mapping of federation reference types */
export type FederationReferenceTypes = {
  Hop:
    ( { __typename: 'Hop' }
    & GraphQLRecursivePick<FederationTypes['Hop'], {"id":true}> );
  Solve:
    ( { __typename: 'Solve' }
    & GraphQLRecursivePick<FederationTypes['Solve'], {"id":true}> );
};



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Attempt: ResolverTypeWrapper<Attempt>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Hop: ResolverTypeWrapper<Hop>;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Solve: ResolverTypeWrapper<DBSolve>;
  SolveQueryInput: SolveQueryInput;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Attempt: Attempt;
  String: Scalars['String']['output'];
  ID: Scalars['ID']['output'];
  DateTime: Scalars['DateTime']['output'];
  Hop: Hop | FederationReferenceTypes['Hop'];
  JSONObject: Scalars['JSONObject']['output'];
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  Solve: DBSolve;
  SolveQueryInput: SolveQueryInput;
  Boolean: Scalars['Boolean']['output'];
};

export type AttemptResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Attempt'] = ResolversParentTypes['Attempt']> = {
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  gameId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createAttempt?: Resolver<Maybe<ResolversTypes['Attempt']>, ParentType, ContextType, RequireFields<MutationCreateAttemptArgs, 'gameId'>>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  solve?: Resolver<Maybe<ResolversTypes['Solve']>, ParentType, ContextType, RequireFields<QuerySolveArgs, 'id'>>;
  solves?: Resolver<Maybe<Array<Maybe<ResolversTypes['Solve']>>>, ParentType, ContextType, RequireFields<QuerySolvesArgs, 'query'>>;
};

export type SolveResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Solve'] = ResolversParentTypes['Solve'], FederationReferenceType extends FederationReferenceTypes['Solve'] = FederationReferenceTypes['Solve']> = {
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Solve']> | FederationReferenceType, FederationReferenceType, ContextType>;
  associationsKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  gameId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hops?: Resolver<Array<ResolversTypes['Hop']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  ownerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  Attempt?: AttemptResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  JSONObject?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Solve?: SolveResolvers<ContextType>;
};

