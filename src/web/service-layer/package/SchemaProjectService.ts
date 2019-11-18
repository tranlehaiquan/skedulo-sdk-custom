import { SchemaProject } from '@skedulo/sked-commons'

import { validateFor } from '../schema-validation'
import { SessionData } from '../types'
import { ProjectService } from './ProjectService'

export class SchemaProjectService extends ProjectService<SchemaProject> {

  static at(packagePath: string, projectName: string, session: SessionData): SchemaProjectService {
    return new SchemaProjectService(packagePath, projectName, session)
  }

  evaluate(data: any) {
    return validateFor<SchemaProject>('SchemaProject', data)
  }
}
