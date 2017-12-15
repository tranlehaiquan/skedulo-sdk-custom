declare module 'ms' {
  var ms: MSStatic;
  export = ms
}

interface MSStatic {
  (value: string): number;
  (value: number, options?: { long: boolean }): string;
}
