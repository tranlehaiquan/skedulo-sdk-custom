import { SessionData } from './types'
import { NetworkingService } from './NetworkingService'
import * as fs from 'fs'

interface Form {
  name: string
  root: string
}

interface Meta {
  sdkVersion: number
}

export interface Definition {
  forms: Form[]
  meta: Meta
}

interface FormRev {
  id: string
  formId: string
  version: number
  definition: Definition
  files: string[]
}

export interface JobTypes {
  label: string
  value: string
}

export interface FormMetadata {
  id: string
  name: string
  formRev: FormRev
  jobTypes: string[]
}

export class LegacyCustomFormServices {

  private apiRequest = (new NetworkingService(this.session)).getAPIRequest()

  constructor(private session: SessionData) { }

  createForm(name: string) {
    return this.apiRequest.post('/customform/form', {
      body: { name },
      json: true,
      timeout: 120000 // 2mins
    })
      .then(response => response.created.id as string)
  }

  async deployForms(definition: Definition, filePaths: string[]) {

    const formName = definition.forms.map(f => f.name).join('') + Date.now()
    const formId = await this.createForm(formName)

    const res = await this.apiRequest.post(`/customform/file/upload/${formId}`, {
      formData: {
        attachments: filePaths.map(file => fs.createReadStream(file))
      }
    })

    return res.created
  }
}
