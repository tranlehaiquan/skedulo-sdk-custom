import * as RP from 'request-promise'
import { SessionData } from './types'

export class NetworkingService {

  private _baseRequest = RP.defaults({
    headers: { Authorization: 'Bearer ' + this.session.token },
    timeout: 15000,
    gzip: true
  })

  private _apiRequest = this._baseRequest.defaults({
    baseUrl: this.session.API_SERVER,
    json: true
  })

  constructor(private session: SessionData) { }

  public getAPIRequest() {
    return this._apiRequest
  }

  public getRequest() {
    return this._baseRequest
  }
}
