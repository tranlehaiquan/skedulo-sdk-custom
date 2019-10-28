
import { Services, Vocabulary } from './Services'

export class DataServices {

  private vocabularyP: Promise<Vocabulary> | null = null

  constructor(private services: Services) { }

  getVocabulary() {

    if (!this.vocabularyP) {
      this.vocabularyP = this.services.metadata.fetchVocabulary()
    }

    return this.vocabularyP
  }

  fetchJobs() {

    return this.services.graphQL
      .fetch<{ jobs: Job[] }>({
        query: JobsQuery
      })
      .then(({ jobs }) => jobs)
  }

  fetchProducts() {

    return this.services.graphQL
      .fetch<{ products: Product[] }>({
        query: ProductsQuery
      })
      .then(({ products }) => products)
  }

  createProduct(input: NewProducts) {

    return this.services.graphQL
      .mutate({
        query: CreateProductMutation,
        variables: { input }
      })
  }

  updateProduct(input: UpdateProduct & { UID: string }) {

    return this.services.graphQL
      .mutate({
        query: UpdateProductMutation,
        variables: { input }
      })
  }

  deleteProduct(id: string) {
    return this.services.graphQL
      .mutate({
        query: DeleteProductMutation,
        variables: {
          id
        }
      })
  }
}

/**
 * Query and Type Definitions
 */

export interface Job {
  UID: string
  Name: string
  Description: string
}

const JobsQuery = `
{
  jobs {
    edges {
      node {
        UID
        Name
        Description
      }
    }
  }
}
`

export interface Product {
  Description: string
  Family: string
  IsActive: boolean
  Name: string
  ProductCode: string
  UID: string
}

const ProductsQuery = `
query Products {
  products {
    edges {
      node {
        UID
        Description
        Family
        IsActive
        Name
        ProductCode
      }
    }
  }
}
`

export interface NewProducts {
  Description: string
  Family: string
  IsActive: boolean
  Name: string
  ProductCode: string
}

const CreateProductMutation = `
mutation CreateProduct($input: NewProducts!) {
  schema {
    insertProducts(input: $input)
  }
}
`

interface UpdateProduct {
  Description: string
  Family: string
  IsActive: boolean
  Name: string
  ProductCode: string
  UID: string
}

const UpdateProductMutation = `
mutation UpdateProductMutation($input: UpdateProducts!) {
  schema {
    updateProducts(input: $input)
  }
}
`

const DeleteProductMutation = `
mutation DeleteProductMutation($id: ID!) {
  schema {
    deleteProducts(UID: $id)
  }
}
`
