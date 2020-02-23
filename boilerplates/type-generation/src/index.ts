/**
 * This file should export anything that needs to be available to other projects.
 * This might include the types that are derived from queries or the generated
 * documents themselves that can be used to execute the queries.
 */

// Converted types representing data available in queries
export { JobProduct, Product, ManageJobProductsData } from './custom-types'

// Documents for execution
export { fetchJobsWithJobProducts, fetchProducts } from './queries/queries.graphql'

// Raw generated types for other use (raw schema types from server)
export { JobProducts, NewJobProducts, UpdateJobProducts, FetchJobsWithJobProducts, FetchProducts } from './__graphql/graphql'
