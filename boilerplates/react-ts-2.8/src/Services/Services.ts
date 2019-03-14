
interface GraphQLRequest {
  query: string
  variables?: Record<string, any>
  operationName?: string
  context?: Record<string, any>
  extensions?: Record<string, any>
}

export interface GraphQLMutationResult {
  data: null | { schema: { [operationName: string]: string } }
  errors: null | {
    message: string
    path?: string[]
    locations?: { line: number, column: number }[]
  }[]
}

interface GraphQLError {
  getErrors: () => string[]
  // tslint:disable:no-misused-new
  new(): GraphQLError
}

type Model = string

interface IntrospectionField {
  name: string
  type: {
    name: null | 'Instant' | 'Boolean' | 'BigDecimal' | 'String' | Model
    kind: 'SCALAR' | 'NON_NULL' | 'OBJECT' | 'LIST'
    ofType: null | IntrospectionField['type']
  }
}

interface IntrospectionModelType {
  __type: {
    name: string
    fields: IntrospectionField[]
  }
}

export interface Vocabulary {
  [schema: string]: {
    [field: string]: {
      value: string,
      label: string
    }[]
  }
}

export interface Services {
  graphQL: {
    fetch<T>(operation: GraphQLRequest, endpoint?: string): Promise<T>
    mutate(operation: GraphQLRequest, endpoint?: string): Promise<GraphQLMutationResult>
    fetchMetadataFor(model: string): Promise<IntrospectionModelType>
  },
  metadata: {
    fetchVocabulary(): Promise<Vocabulary>
  },
  errorClasses: {
    GraphQLNetworkError: GraphQLError,
    GraphQLExecutionError: GraphQLError
  },
}

export interface Profile {
  tenantId: string
  userId: string
  username: string
  roles: string[]
}

export interface Credentials {
  apiServer: string
  apiAccessToken: string

  vendor: { type: 'skedulo', url: string, token: null } | { type: 'salesforce', url: string, token: string }
}

declare const skedInjected: {
  Services: Services,
  context?: string,
  profile: Profile,
  credentials: Credentials
}

export const Services = skedInjected.Services
export const context = skedInjected.context
export const profile = skedInjected.profile
export const credentials = skedInjected.credentials
