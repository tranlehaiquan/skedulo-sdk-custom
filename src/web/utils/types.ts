export function enumUnreachable(_x: never): never {
  throw new Error('This will never throw since it would cause a type-check error during the compile step')
}
