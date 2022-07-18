import { SkedError } from "../../SkedError";
import { MainServices } from "../service-layer/MainServices";
import { log } from "../logging/logWrapper";

export async function errorHandler(error: unknown, errorBoxTitle?: string) {
  if (error instanceof SkedError) {
    MainServices.showAndLogErrorMessage(
      errorBoxTitle ? errorBoxTitle : error.name,
      error.message,
      JSON.stringify(error)
    );
  } else if (error instanceof Error) {
    MainServices.showAndLogErrorMessage(
      errorBoxTitle ? errorBoxTitle : error.name,
      error.message,
      JSON.stringify(error)
    );
  } else {
    log(error);
    throw error;
  }
}
