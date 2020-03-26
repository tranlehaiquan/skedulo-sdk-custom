import * as React from 'react'
import * as _ from 'lodash'
import * as path from 'path'
import { Button, DynamicModal, EmptyState, Lozenge } from '@skedulo/sked-ui'
import { PackageService, AllProjectService } from '../../service-layer/package/PackageService'
import { LibraryProjectService } from '../../service-layer/package/LibraryProjectService'
import { addLocalNodeDependencyToPackage, removeLocalNodeDependencyFromPackage } from '../../service-layer/package/dependency-utils'
import { MainServices } from '../../service-layer/MainServices'

interface Props {
  package: PackageService
  selectedProject: AllProjectService
  refreshPackage: (goToConfiguration: boolean) => Promise<void>
  closeModal: () => void
}

interface State {
  inProgress: boolean
}

interface LibraryDependency {
  service: LibraryProjectService
  isCircular: boolean
  isActive: boolean
}

export class DependenciesModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      inProgress: false
    }
  }

  addDependency = (dependency: LibraryProjectService, dependant: AllProjectService) => async () => {
    const { refreshPackage, package: pkg } = this.props

    try {
      this.setState({ inProgress: true })

      await addLocalNodeDependencyToPackage({
        dependantPath: path.join(pkg.packagePath, dependant.pathName),
        dependencyName: dependency.project.name,
        dependencyPath: path.join(pkg.packagePath, dependency.pathName),
        options: {
          devDependency: false
        }
      })
    } catch (error) {
      MainServices.showErrorMessage('Failed to add dependency', error)
    } finally {
      this.setState({ inProgress: false })

      refreshPackage(false)
    }
  }

  removeDependency = (dependency: LibraryProjectService, dependant: AllProjectService) => async () => {
    const { refreshPackage, package: pkg } = this.props

    try {
      this.setState({ inProgress: true })

      await removeLocalNodeDependencyFromPackage({
        dependantPath: path.join(pkg.packagePath, dependant.pathName),
        dependencyName: dependency.project.name
      })
    } catch (error) {
      MainServices.showErrorMessage('Failed to remove dependency', error)
    } finally {
      this.setState({ inProgress: false })

      refreshPackage(false)
    }
  }

  renderModalItem = (dep: LibraryDependency) => {
    const { selectedProject } = this.props

    return (
      <div key={ dep.service.pathName } className="dependencies-modal__item">
        <div className="float-left">
          <h3 className="h3">{ dep.service.project.name }</h3>
          <p>{ dep.service.project.description }</p>
        </div>
          {
            dep.isCircular 
              ? (
                <Lozenge
                  label="Dependency would be circular"
                  color="red"
                  className="float-right"
                  size="small"
                  icon="warning"
                />
              ) : (
                <Button
                  buttonType="secondary"
                  className="float-right"
                  compact={ true }
                  onClick={ dep.isActive
                    ? this.removeDependency(dep.service, selectedProject)
                    : this.addDependency(dep.service, selectedProject)
                  }
                  icon={ dep.isActive ? "minus" : "plus" }
                >
                  { dep.isActive ? 'Remove dependency' : 'Add dependency'}
                </Button>
              )
          }
      </div>
    )
  }

  getLibraryDependencies = () => {
    const { selectedProject } = this.props
    const { libraries } = this.props.package

    const activeNodeDependencies = (selectedProject.project.dependencies || []).map(dep => dep.dependencyName)

    return libraries
      .filter(lib => lib.project.name !== selectedProject.project.name)
      .map(lib => {

        const dependenciesForLib = (lib.project.dependencies || []).map(dep => dep.dependencyName)
        
        return {
          service: lib,
          isCircular: dependenciesForLib.includes(selectedProject.project.name),
          isActive: activeNodeDependencies.includes(lib.project.name)
        }
      })
  }

  render() {
    const { selectedProject, closeModal } = this.props
    const { inProgress } = this.state

    const header = (
      <div className="dependencies-modal__header">
        <h2 className="h2">Dependencies for { selectedProject.project.name }</h2>
      </div>
    )

    const footer = (
      <div className="dependencies-modal__footer">
        <Button buttonType="primary" className="float-right" onClick={ closeModal }>Close</Button> 
      </div>
    )

    const emptyState = (
      <EmptyState imgSrc="" title="No dependencies" message="No libraries available to use as dependencies" />
    )

    const libraryDependencies = this.getLibraryDependencies()

    return (
      <DynamicModal
        header={ header }
        footer={ footer }
        loading={ inProgress }
        className="dependencies-modal"
      >
        { libraryDependencies.length 
          ? libraryDependencies.map(this.renderModalItem)
          : emptyState
        }
      </DynamicModal>
    )
  }
}
