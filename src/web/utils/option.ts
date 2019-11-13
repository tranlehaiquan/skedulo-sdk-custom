import * as _ from 'lodash'

/**
 * API wise this is a near 1 to 1 implementation of Option from `https://github.com/gcanti/fp-ts`
 * Options are a way to represent nullable data with an consistent API to manitupate the data within.
 *
 * Example
 *
 * Without Option:
 * const someArray: { id: number, message: string }[] = [...]
 * const data = someArray.find(d => d.id == 3) // Returns the object or undefined
 * console.log(data.message) // This will likely blow up at some point if you forget to handle it or you didn't think it could happen
 *
 * With Option:
 * const someArray: { id: number, message: string }[] = [...]
 * const optData = Option.of(someArray.find(d => d.id == 3)) // In some languages like Scala, the .find operation will by default return an Option
 * const message = optData
 *  .map(data => data.message) // If the Option was a Some, this will run and you get the message
 *  .getOrElse('No message found!') // If the Option was a None, this will return the fallback value
 * console.log(message) // You can be sure something will render without error at this point
 *
 * Or you could transform the data:
 * const optIsHelloWorld = optData.map(data => data.message === 'Hello World') // `Option<{ id: number, message: string }>` changes to `Option<boolean>`
 * console.log(optIsHelloWorld.getOrElse(false))
 *
 */
export abstract class Option<T> {
  static of<V>(v: V | null | undefined): Option<V> {
    return _.isNil(v) ? new None() : new Some(v)
  }

  abstract next<K extends keyof T>(key: K): Option<T[K]>
  abstract nextAll<K extends keyof T>(...keys: K[]): Option<Pick<T, K>>
  abstract map<R>(fn: (v: T) => R): Option<R>
  abstract flatMap<R>(fn: (v: T) => Option<R>): Option<R>
  abstract getOrElse(fallback: T): T
  abstract getOrElseL(fn: () => T): T
  abstract or(fallback: T | null | undefined): Option<T>
  abstract orElse(fallback: Option<T>): Option<T>
  abstract match<R>(none: () => R, some: (v: T) => R): R
  abstract filter(fn: (v: T) => boolean): Option<T>
  abstract get orNull(): T | null
  abstract get toArray(): T[]
  abstract get isDefined(): boolean
}

export class Some<T> extends Option<T> {
  static some<T>(v: T): Option<T> {
    return new Some(v)
  }

  constructor(readonly value: T) {
    super()
  }

  next<K extends keyof T>(key: K): Option<T[K]> {
    return Option.of(this.value[key])
  }

  nextAll<K extends keyof T>(...keys: K[]): Option<Pick<T, K>> {
    const values = keys.map(k => this.value[k])
    return values.some(_.isNil) ? new None() : new Some<any>(_.zipObject(keys, values))
  }

  map<R>(fn: (v: T) => R): Option<R> {
    return Option.of(fn(this.value))
  }

  flatMap<R>(fn: (v: T) => Option<R>): Option<R> {
    return fn(this.value)
  }

  getOrElse(_fallback: T): T {
    return this.value
  }

  getOrElseL(_fn: () => T): T {
    return this.value
  }

  or(_fallback: T | null | undefined): Option<T> {
    return this
  }

  orElse(_fallback: Option<T>): Option<T> {
    return this
  }

  // tslint:disable-next-line:no-shadowed-variable
  match<R>(_none: () => R, some: (v: T) => R): R {
    return some(this.value)
  }

  filter(fn: (v: T) => boolean): Option<T> {
    return fn(this.value) ? Option.of(this.value) : none
  }

  get orNull(): T | null {
    return this.value
  }

  get toArray(): T[] {
    return [this.value]
  }

  get isDefined(): boolean {
    return true
  }
}

class None<T> extends Option<T> {

  static none: Option<never> = new None()

  next<K extends keyof T>(_key: K): Option<T[K]> {
    return None.none
  }

  nextAll<K extends keyof T>(..._keys: K[]): Option<Pick<T, K>> {
    return None.none
  }

  map<R>(_fn: (v: T) => R): Option<R> {
    return None.none
  }

  flatMap<R>(_fn: (v: T) => Option<R>): Option<R> {
    return None.none
  }

  getOrElse(fallback: T): T {
    return fallback
  }

  getOrElseL(fn: () => T): T {
    return fn()
  }

  or(fallback: T | null | undefined): Option<T> {
    return Option.of(fallback)
  }

  orElse(fallback: Option<T>): Option<T> {
    return fallback
  }

  // tslint:disable-next-line:no-shadowed-variable
  match<R>(none: () => R, _some: (v: T) => R): R {
    return none()
  }

  filter(_fn: (v: T) => boolean): Option<T> {
    return none
  }

  get orNull(): T | null {
    return null
  }

  get toArray(): T[] {
    return []
  }

  get isDefined(): boolean {
    return false
  }
}

export const none = None.none
export const some = Some.some
