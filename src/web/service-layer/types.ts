import { Subject } from 'rxjs/Subject'

export interface ProjectData {
  url: string
  title: string
  menuID: string
}

export interface SessionData {
  token: string
  REALTIME_SERVER: string
  API_SERVER: string
}

export enum EventType {
  Session,
  NewProject
}

export interface INewProject {
  type: EventType.NewProject
  payload?: undefined
}

export interface ISession {
  type: EventType.Session
  payload: SessionData | null
}

export interface ICoverageItem {
  pct: number
  total: number
  covered: number
  skipped: number
}

export interface ICoverage {
  total: {
    lines: ICoverageItem
    branches: ICoverageItem
    functions: ICoverageItem
    statements: ICoverageItem
  }
}

export type Event = INewProject | ISession

export type Channel = Subject<Event>
