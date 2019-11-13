export enum Version {
  One = '1'
}

export enum ProjectType {
  Function = 'function',
  WebPage = 'webpage',
  MobilePage = 'mobilepage',
  Schema = 'schema'
}

export enum WebPageType {
  Embedded = 'embedded',
  Page = 'page'
}

export enum WebPageHook {
  ResourceDetails = 'resource-details',
  JobDetails = 'job-details'
}

export enum NodeVersion {
  V810 = 'nodejs8.10'
}

export enum BuildAction {
  Test = 'test',
  Deploy = 'deploy'
}

export enum BuildStatus {
  Pending = 'Pending',
  Running = 'Running',
  Passed = 'Passed',
  Failed = 'Failed'
}
