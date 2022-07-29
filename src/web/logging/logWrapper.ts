import { log as electronLog } from "electron-log";

let isProduction: boolean;

export const setEnvironment = ( isProd: boolean ) => {
  isProduction = isProd
}

export const log = (logContent: unknown) => {
  if(isProduction){
    electronLog(logContent)
  } else {
    console.log(logContent)
  }
}
