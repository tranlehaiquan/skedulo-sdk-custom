import * as React from 'react'
import { WebPageProject, MobilePageProject, FunctionProject, LibraryProject } from '@skedulo/packaging-internal-commons'

import { ProjectService } from '../../service-layer/package/ProjectService'
import { FunctionProjectService } from '../../service-layer/package/FunctionProjectService'
import { MobilePageProjectService } from '../../service-layer/package/MobilePageProjectService'
import { WebPageProjectService } from '../../service-layer/package/WebPageProjectService'
import { PackageService } from '../../service-layer/package/PackageService'
import { ContentLayout } from '../Layout'
import { ActiveLambdaProject } from './ActiveLambdaProject'
import { ActiveMobilePageProject } from './ActiveMobilePageProject'
import { ActiveWebPageProject } from './ActiveWebPageProject'
import { LibraryProjectService } from '../../service-layer/package/LibraryProjectService'
import { ActiveLibraryProject } from './ActiveLibraryProject'

interface Props {
  back: () => void
  packageService: PackageService
  activeProjects: (ProjectService<FunctionProject> | ProjectService<MobilePageProject> | ProjectService<WebPageProject> | ProjectService<LibraryProject>)[]
}

export class ActiveProjectWrapper extends React.PureComponent<Props, {}> {
  renderActiveProjectList = () => {
    const { activeProjects, back, packageService } = this.props

    return activeProjects.map((project, index) => {
      if (project instanceof FunctionProjectService) {
        return (
          <ActiveLambdaProject
            key={ index }
            packageService={ packageService }
            projectService={ project }
            back={ !index ? back : undefined }
            concurrentActiveProject={ activeProjects.length > 1 }
          />
        )
      } else if (project instanceof MobilePageProjectService) {
        return (
          <ActiveMobilePageProject
            key={ index }
            packageService={ packageService }
            projectService={ project }
            back={ !index ? back : undefined }
            concurrentActiveProject={ activeProjects.length > 1 }
          />
        )
      } else if (project instanceof WebPageProjectService) {
        return (
          <ActiveWebPageProject
            key={ index }
            packageService={ packageService }
            projectService={ project }
            back={ !index ? back : undefined }
            concurrentActiveProject={ activeProjects.length > 1 }
          />
        )
      } else if (project instanceof LibraryProjectService) {
        return (
          <ActiveLibraryProject
            key={ index }
            packageService={ packageService }
            projectService={ project }
            back={ !index ? back : undefined }
            concurrentActiveProject={ activeProjects.length > 1 }
          />
        )
      } else {
        throw new Error('Cannot update this type of project')
      }
    })
  }

  render() {
    return (
      <ContentLayout>
        { this.renderActiveProjectList() }
      </ContentLayout>
    )
  }
}
