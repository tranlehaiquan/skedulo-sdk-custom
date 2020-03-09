import { FormConfig } from '@skedulo/sked-ui'

export const PROJECT_NAME_VALIDATION: FormConfig = {
  isMaxLength: {
    message: 'Name cannot be longer than 64 characters',
    length: 64
  } as any,
  isMinLength: {
    message: 'Name cannot be shorter than 4 characters',
    length: 4
  } as any,
  isRequired: {
    message: 'Please enter a project name'
  },
  isRegexMatch: {
    regex: /^[a-z0-9_]+$/i,
    message: 'Please enter a valid alphanumeric project name (use underscore)'
  } as any
}

export const PROJECT_DESCRIPTION_VALIDATION: FormConfig = {
  isMaxLength: {
    message: 'Name cannot be longer than 500 characters',
    length: 500
  } as any,
  isMinLength: {
    message: 'Description cannot be shorter than 4 characters',
    length: 4
  } as any,
  isRequired: {
    message: 'Please enter a project description'
  }
}

export const FUNCTION_PROJECT_NAME_VALIDATION: FormConfig = {
  ...PROJECT_NAME_VALIDATION,
  isMaxLength: {
    message: 'Name cannot be longer than 64 characters',
    length: 20
  } as any
}