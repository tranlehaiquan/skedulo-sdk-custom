/**
 * @author Harish Subramanium
 * Basic ( is this a lens? ) implementation to get
 * scoping working cleanly within our codebase
 */

import { get, set as mutableSet } from 'lodash'
const immutableSet = require('lodash/fp/set') as any

export type LensInstanceSetData<S> = (store: S) => S
export type LensInstanceSet<S, T> = (data: T) => LensInstanceSetData<S>
export type LensInstanceOver<S, T> = (fn: (t: T) => T) => LensInstanceSetData<S>

export interface ILensInstance<S, T> {
  get: (store: S) => T
  set: LensInstanceSet<S, T>
  over: LensInstanceOver<S, T>
}

export function Lens<S, T>(...args: string[]): ILensInstance<S, T> {

  return {
    get: (store: S) => get(store, args),
    set: (data: T) => (store: S) => immutableSet(args, data, store),
    over: (fn: (t: T) => T) => (store: S) => immutableSet(args, fn(get(store, args)), store)
  }
}

export function MutableLens<S extends object, T>(...args: string[]): ILensInstance<S, T> {

  return {
    get: (store: S) => get(store, args),
    set: (data: T) => (store: S) => mutableSet(store, args, data),
    over: (fn: (t: T) => T) => (store: S) => {
      const lens = MutableLens<S, T>(...args)
      return lens.set(fn(lens.get(store)))(store)
    }
  }
}

export function LensCompose<S, T, U>(A: ILensInstance<S, T>, B: ILensInstance<T, U>): ILensInstance<S, U> {

  return {
    get: (store: S) => B.get(A.get(store)),
    set: (data: U) => (store: S) => A.set(B.set(data)(A.get(store)))(store),
    over: (fn: (t: U) => U) => (store: S) => A.set(B.over(fn)(A.get(store)))(store)
  }
}

function SourceLens<S, T extends keyof S>(arg: T): ILensInstance<S, S[T]> {
  return {
    get: (store: S): S[T] => get(store, arg),
    set: (data: S[T]) => (store: S): S => immutableSet(arg, data, store),
    over: (fn: (t: S[T]) => S[T]) => (store: S) => immutableSet(arg, fn(get(store, arg)), store)
  }
}

export function TypedLens<T>(arg: keyof T) {
  return SourceLens<T, keyof T>(arg)
}

/**
 * Example of this working.
 * Uncomment the following lines to see how this is used
 */

/*
// Object Lens
// Empty store
const store = {}

// Creating scope
const helloLens = Lens<{}, {}>('hello')
const wideLens = Lens<{}, string>('wide')

const helloWideLens = LensCompose(helloLens, wideLens)

const newStore = helloWideLens.set('world')(store)

console.log('newStore ->', newStore)
console.log('helloWideLens get', helloWideLens.get(newStore))
console.log('helloLens get -->', helloLens.get(newStore))

// Array Lens
const arrayStore:string[] = []

const mainSubArrayLens = Lens<string[], string[]>('50', '25')
const innerLens = Lens<string[], string>('3')

const deepNestedArrayLens = LensCompose(mainSubArrayLens, innerLens)

const newArrayStore = deepNestedArrayLens.set('hello world')(arrayStore)
console.log('array newStore -> ', newArrayStore)
console.log('deepNestedArrayLens get -->', deepNestedArrayLens.get(newArrayStore))

*/
