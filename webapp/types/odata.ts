import type { Dict } from "sphinxjsc/com/ems/types/utlis";

export interface ODataResponse<D = unknown> {
  results: D;
}

export interface ODataError {
  header?: Dict;
  message?: string;
  statusCode?: string;
  statusText?: string;
  responseText?: string;
}
