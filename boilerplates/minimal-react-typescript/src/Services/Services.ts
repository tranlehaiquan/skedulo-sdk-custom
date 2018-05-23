
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
    fetch<T>(operation: GraphQLRequest): Promise<T>
    mutate(operation: GraphQLRequest): Promise<GraphQLMutationResult>
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

declare const skedInjected: {
  Services: Services,
  context?: string
}

export const Services = skedInjected.Services
export const context = skedInjected.context
