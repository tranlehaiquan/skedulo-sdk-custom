import { Subject } from 'rxjs/Subject'

export enum ProjectType {
  ConnectedPage,
  CustomForm
}

export interface ProjectData {
  version: number

  title: string
  description: string

  url: string
  menuID: string
  showInNavBar: boolean
}

export interface MobileProjectData {
  projectName: string,
  formType: 'resource' | 'job'
}

export interface SessionData {
  token: string
  origin: string
  API_SERVER: string
  REALTIME_SERVER: string
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

export interface WhoAmI {
  resourceId: string
  tenantId: string
  userId: string
  username: string
  vendorInfo: {
    vendor: string
    vendorUserId: string
  }
  roles: string[]
}

export interface UserMetadata {
  id: string,
  email: string,
  username: string,
  fullName: string,
  profileId: string,
  roleId: string,
  orgName: string,
  orgId: string,
  userroles: string,
  smallPhotoUrl: string,
  category: null,
  resourceId: string,
  team: {
    id: string,
    name: string,
    description: string,
    vendor: string,
    orgId: string
  }
}
