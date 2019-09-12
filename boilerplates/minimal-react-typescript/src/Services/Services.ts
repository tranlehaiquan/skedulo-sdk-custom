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

// tslint:disable:no-misused-new
interface GraphQLError {
  getErrors: () => string[]
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

export interface Navigation {
  registerRouteHandler: (routeHandler: (routeState: {
    routes: string | string[],
    params: { [paramName: string]: any }
  }) => void) => void
  setParentRoute: (route: string) => void
}

declare const skedInjected: {
  Services: Services,
  context?: string | string[],
  params: { [paramName: string]: any }
  profile: Profile,
  credentials: Credentials
  navigation: Navigation
}

export const Services = skedInjected.Services
export const context = skedInjected.context
export const params = skedInjected.params
export const profile = skedInjected.profile
export const credentials = skedInjected.credentials
export const navigation = skedInjected.navigation
