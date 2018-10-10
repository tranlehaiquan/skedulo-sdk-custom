import _ from 'lodash'
import { Query } from '@skedulo/uranium'

export default wrapper

function wrapper(httpLibs: any, utils: any) {

  const { http, httpAPI } = httpLibs

  function fetch(jobIds: string[]) {
    return fetchJobData(jobIds).then(jobs => buildDataStruct(jobIds, jobs))
  }

  function fetchJobData(jobIds: string []): Promise<{ [jobId: string]: any }> {

    if (!jobIds.length) {
      return Promise.resolve([])
    }

    const query = new Query().limit(5000)

    return query
      .filter('UID IN $1', [jobIds])
      .makeRequest(httpAPI, 'Jobs')
      .then(res => _.groupBy((res as any).records, 'UID')) as Promise<{ [jobId: string]: any }>
  }

  function buildDataStruct(jobIds: string[], jobs: { [jobId: string]: any }) {
    const retObj = jobIds
      .map(jobId => {

        const obj = {
          jobId,
          job: jobs[jobId]
        }

        return { [jobId]: obj }
      })
      .reduce((acc, e) => _.assign(acc, e), {})

    return {
      main: retObj,
      common: { }
    }
  }

  function save(data: any) {
    return saveBulk([data])
  }
  function saveBulk(saveArray: any[]) {
    const cleaned = _.compact(saveArray)

    const jobIds = _.uniq(_.flatten(cleaned.map(items => Object.keys(items))))

    return saveItems(jobIds)
  }

  function saveItems(jobIds: string[]) {
    return fetch(jobIds)
      .then(result => _.pick(result, 'main'))
  }

  return { fetch, save, saveBulk }
}
