import { AxiosInstance } from 'axios'

function convertBlobToDataURI(blob: Blob): Promise<string | ArrayBuffer> {
  return new Promise(resolve => {

    const reader = new FileReader()

    reader.onloadend = () => {
      resolve(reader.result)
    }

    reader.readAsDataURL(blob)

  })
}

export function fetchAsDataURI(url: string, http: AxiosInstance) {
  return Promise.resolve(http.get(url, { responseType: 'blob' }))
  .then(({ data }) => convertBlobToDataURI(data))
}

/**
 * Returns avatar image urls mapped to userIds
 */
export function fetchUserAvatars(userIds: string[], http: AxiosInstance, sizeHint?: 'small' | 'thumbnail'): Promise<{ [userId: string]: string }> {
  if (userIds.length === 0) {
    return Promise.resolve({})
  }

  if (sizeHint && (sizeHint !== 'small' && sizeHint !== 'thumbnail')) {
    return Promise.reject(`Invalid avatar image size given: ${sizeHint}`)
  }

  const queryParameters = sizeHint
    ? '?user_ids=' + userIds.join(',') + '&size_hint=' + sizeHint
    : '?user_ids=' + userIds.join(',')

  return Promise.resolve(http.get('/files/avatar' + queryParameters))
    .then(res => res.data)
    .then(results => {

      const avatars = userIds.map(userId => {
        return {
          [userId]: results.result[userId]
        }
      })

      return Object.assign({}, ...avatars)
    })
}
