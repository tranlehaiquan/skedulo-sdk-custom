import { RawOperationToPrimitive } from '@skedulo/sdk-utilities'
import { FetchJobsWithJobProducts, FetchProducts } from './__graphql/graphql'

/**
 * All exports of the type generation utility projects should be dealt with here.
 * In this use case, we're creating a simple store for managing Job Products by converting
 * some of the GraphQL types that are generated from the queries defined in this project.
 * 
 * First start by defining the building blocks for the store.  Using the RawOperationToPrimitive
 * converter type will sanitize generated types in to flat records making it easier to work with.
 * 
 * Then define and export the store based on those types.
 */

export type JobProduct = RawOperationToPrimitive<FetchJobsWithJobProducts.JobProducts>
export type Product = RawOperationToPrimitive<FetchProducts.Node>

// tslint:disable-next-line:interface-over-type-literal
export type ManageJobProductsData = {
  Products: Product[],
  JobProducts: JobProduct[]
}
