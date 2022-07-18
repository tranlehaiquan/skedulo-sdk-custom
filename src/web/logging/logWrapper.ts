import { log as electronLog } from "electron-log";

let isProduction: boolean;

export const setEnvironment = ( isProduction: boolean ) => {
  isProduction = isProduction
}

export const log = (logContent: unknown) => {
  if(isProduction){
    electronLog(logContent)
  } else {
    console.log(logContent)
  }
}
