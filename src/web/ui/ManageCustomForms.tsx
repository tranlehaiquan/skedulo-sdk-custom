import * as fs from 'fs'
import * as path from 'path'

import * as _ from 'lodash'
import * as React from 'react'
import * as Joi from 'joi'

import { MainServices } from '../service-layer/MainServices'
import { LegacyCustomFormServices, Definition } from '../service-layer/LegacyCustomFormServices'
import { SessionData } from '../service-layer/types'
import { ContentLayout } from './Layout'
import { LoadingIndicator } from './LoadingIndicator'

const CustomFormDefinitionSchema = Joi.compile({
  forms: Joi.array().required().items({
    name: Joi.string().required().label('Form Name'),
    root: Joi.string().required().label('Form Root')
  }),
  meta: Joi.compile({
    sdkVersion: Joi.number().required().label('meta.sdkVersion')
  })
})

interface IProps {
  back: () => void
  session: SessionData
}

interface IState {
  errorMessage: string | null
  selectedDirectory: string | null
  selected: {
    definition: Definition,
    files: string[]
  } | null,
  resultString: string
  resultSuccess: boolean
  deploying: boolean
}

const PACKAGE_FILES = [
  'main.js.gz', 'native.js.gz', 'node.js.gz',
  'main.js.map.gz', 'native.js.map.gz', 'node.js.map.gz',
  'viewSources.zip',
  'definition.json'
]

async function getPackageDefinition(directory: string) {

  const fullFilePaths = PACKAGE_FILES.map(f => path.join(directory, '/', f))

  const allFilesExist = fullFilePaths.every(file => fs.existsSync(file))

  if (!allFilesExist) {
    throw new Error('This does not seem to be a valid project')
  }

  // tslint:disable-next-line:non-literal-require
  const definition = require(path.join(directory, 'definition.json')) as Definition

  // Ensure that the object is valid
  await Joi.validate(definition, CustomFormDefinitionSchema, {
    abortEarly: false,
    allowUnknown: true
  })

  return {
    definition,
    files: fullFilePaths
  }
}

export class ManageCustomForms extends React.PureComponent<IProps, IState> {

  private customFormServices = new LegacyCustomFormServices(this.props.session)

  constructor(props: IProps) {
    super(props)

    this.state = {
      selected: null,
      errorMessage: null,
      selectedDirectory: null,
      deploying: false,
      resultString: '',
      resultSuccess: false
    }
  }

  selectDirectory = async () => {
    const directoryResult = await MainServices.selectDirectory()
    const selectedDirectory = _.head(directoryResult.filePaths) || ''

    if (!selectedDirectory) {
      this.reset()
    }

    try {
      const { files, definition } = await getPackageDefinition(selectedDirectory!)
      this.setState({ selected: { definition, files }, selectedDirectory, resultString: '', resultSuccess: false })
    } catch {
      this.reset()
    }
  }

  reset = () => this.setState({ selected: null, selectedDirectory: null, resultString: '', resultSuccess: false })

  deployForm = async () => {

    this.setState({ deploying: true })

    const { definition, files } = this.state.selected!

    try {
      await this.customFormServices.deployForms(definition, files)
      this.setState({ resultString: 'Custom form package uploaded successfully!', resultSuccess: true })
    } catch (err) {
      this.setState({ resultString: 'Custom form package upload failed : \n' + JSON.stringify(err), resultSuccess: false })
    } finally {
      this.setState({ deploying: false })
    }
  }

  renderFormDetails = () => {

    const definition = this.state.selected!.definition

    return (
      <div className="padding-bottom text-left">
        <h2>Forms in custom form package</h2>
        <ul>
          { definition.forms.map((f, index) => <li key={ index }>{ f.name }</li>) }
        </ul>
      </div>
    )
  }

  render() {

    const { errorMessage, selectedDirectory, deploying, resultString, resultSuccess } = this.state
    const sucessCssClass = resultSuccess ? 'success' : 'alert'

    if (deploying) {
      return <LoadingIndicator withOverlay />
    }

    return (
      <ContentLayout centered>

        <div className="new-project-title">
          <button className="sk-button-icon transparent" onClick={ this.props.back }><i className="ski ski-arrow-left" /></button>
          Deploy Custom Forms
        </div>

        <div className="padding-top padding-bottom">
          <label>
            <span className="span-label">Project/s</span>
            { errorMessage && <div className="callout warning">{ errorMessage }</div> }
            <input type="text" placeholder="Select project" value={ this.state.selectedDirectory || '' } onClick={ this.selectDirectory } />
          </label>
        </div>

        { this.state.selected && this.renderFormDetails() }

        <div className="margin-bottom">
          <button className="sk-button transparent" onClick={ this.props.back }>Cancel</button>

          <button
            className="sk-button primary"
            onClick={ this.deployForm }
            disabled={ !selectedDirectory || deploying }>
            Deploy Form
        </button>
        </div>

        { resultString && <div className={ 'text-left callout ' + sucessCssClass }>{ resultString }</div> }
      </ContentLayout>
    )
  }
}
