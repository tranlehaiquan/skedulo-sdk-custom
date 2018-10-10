import { AxiosInstance } from 'axios'

export function fetchAsDataURI(url: string, http: AxiosInstance) {
  return Promise.resolve(http.get(url, { responseType: 'arraybuffer' }))
    .then(res => {
      const base64 = res.data.toString('base64')
      return `data:${res.headers['content-type']};base64,` + base64
    })
}

/**
 * Returns avatar data in base64 mapped to userIds
 */
export function fetchUserAvatars(userIds: string[], http: AxiosInstance, sizeHint: 'small' | 'thumbnail'): Promise<{ [userId: string]: string }> {
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
      return Promise.all(userIds.map(userId => {
        return fetchAsDataURI(results.result[userId], http)
          .then(avatarData => ({ [userId]: avatarData }))
      })).then(avatars => Object.assign({}, ...avatars))
    })
}
