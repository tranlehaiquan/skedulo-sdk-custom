import * as _ from 'lodash'

type ReactFormTypes = React.SyntheticEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>

export class FormHelper<T extends {}> {

  constructor(private formObj: T, private onSet: (formObj: T) => void) { }

  set<K extends keyof T>(key: K, value: T[K] | undefined) {
    this.formObj = Object.assign({}, this.formObj, { [key as string]: value })
    this.onSet(this.formObj)
  }

  setForKey = <K extends keyof T>(key: K) => (value?: T[K]) => this.set(key, value)
  clearForKey = <K extends keyof T>(key: K) => () => this.set(key, void 0)

  setForMultiple = (v: Pick<T, keyof T>)  => {
    this.formObj = Object.assign({}, this.formObj, v)
    this.onSet(this.formObj)
  }

  setMap = <K extends keyof T, U extends ReactFormTypes>(key: K, map: (e: U) => T[K] = e => e.currentTarget.value as any) => (e: U) => this.set(key, map(e))

  setAndValidateField = <K extends keyof T, U extends ReactFormTypes>(key: K, validateField: (key: K, value: T[K] | undefined) => void, map: (e: U) => T[K] = e => e.currentTarget.value as any) => (e: U) =>  {
    this.set(key, map(e))
    validateField(key, map(e))
  }

  isValid = () => {
    return Object.values(this.formObj).every(val => !!val)
  }
}

export function slugify(term: string) {
  return _.chain(term).trim().kebabCase().escape().value().toLowerCase()
}
