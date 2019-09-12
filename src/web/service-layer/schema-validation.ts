
import * as AJV from 'ajv'
import { MainServices } from './MainServices'

const schema = MainServices.getSchemaJSON()

const ajv = new AJV({ allErrors: true, coerceTypes: false }).addSchema(schema, 'schema')

export class ValidationError extends Error {
  constructor(public message: string, public errors: AJV.ErrorObject[]) {
    super(message)
  }
}

export function validateFor<T = any>(model: string, data: T): T {
  if (ajv.validate(`schema#/definitions/${model}`, data) as boolean) {
    return data
  } else {
    throw new ValidationError(ajv.errorsText(ajv.errors!, { dataVar: 'data.' }), ajv.errors!)
  }
}
