
global.skedInjected = {
  Services: {
    graphQL: {
      fetch: () => Promise.resolve([]),
      mutate: () => Promise.resolve([]),
      fetchMetadataFor: () => Promise.resolve({})
    },
    metadata: {
      fetchVocabulary: () => Promise.resolve({})
    },
    errorClasses: {
      GraphQLNetworkError: Error,
      GraphQLExecutionError: Error
    }
  }
}
