import * as _ from 'lodash'


type ReactFormTypes = React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>

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

  setMap = <K extends keyof T>(key: K, map: (e: ReactFormTypes) => T[K] = e => e.currentTarget.value as any) => (e: ReactFormTypes) => this.set(key, map(e))

  isValid = () => {
    return Object.values(this.formObj).every(val => !!val)
  }
}

export function slugify(term: string) {
  return _.chain(term).trim().kebabCase().escape().value().toLowerCase()
}
