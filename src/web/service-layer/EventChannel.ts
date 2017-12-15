import { ReplaySubject } from 'rxjs'

import { start } from '../server/server'
import { Event, EventType, ISession } from './types'

export class EventChannel {

  private subject = new ReplaySubject<Event>(0)
  private obs$ = this.subject.share()

  private closeServer = start(this.subject)

  onNewProject() {
    return this.obs$
      .filter(({ type }) => type === EventType.NewProject)
      .map(() => void 0)
  }

  onSessionEvent() {
    return this.obs$
      .filter(({ type }) => type === EventType.Session)
      .map(({ payload }) => payload as ISession['payload'])
  }

  dispose() {
    this.closeServer()
  }
}
