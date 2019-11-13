
export interface Response {
  status: 200 | 201 | 202 | 400 | 401 | 402 | 404 | 500 | 501 | 502 | number
  body?: any
}

export interface FnPayload {
  method: string
  path: string
  querystring?: string | null,
  headers: {
    Authorization: string
    'sked-api-server': string
    [key: string]: string
  }
  body: any
}

export interface RouteIterface {
  method: 'post' | 'get' | 'put' | 'delete'
  path: string
  handler: (body: FnPayload['body'], headers: FnPayload['headers'], method: string, path: string, querystring?: string | null) => Promise<Response>
}
