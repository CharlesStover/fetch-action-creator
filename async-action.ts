'use strict';

type ActionCreator<T> = (param: T) => Object;
type AsyncAction = (dispatch: Dispatch, getState: ObjectCreator) => Promise<void>;
interface AsyncActionCreator {
  default?: AsyncActionCreator;
  (
    url: string,
    body: Object | ObjectCreator,
    onRequest: null | ObjectCreator,
    onReceive: ActionCreator<string> | null,
    onError: ActionCreator<Error> | null,
    cont: Continue | null
  ): AsyncAction;
}
type Continue = (state: Object) => boolean;
type Dispatch = (action: Object) => any;
type ObjectCreator = () => Object;

import 'whatwg-fetch';

export const asyncActionCreator: AsyncActionCreator = (url, body = {}, onRequest = null, onReceive = null, onError = null, cont = null) => {
  return (dispatch, getState) => {

    // If we have a condition for fetching, check if we should continue.
    if (cont) {
      if (!cont(getState())) {
        return Promise.resolve();
      }
    }

    // Action: Requesting data.
    if (onRequest) {
      dispatch(onRequest());
    }

    // Error Handler
    const errorHandler = (error: Error) => {
      if (onError) {
        if (!error.message) {
          error.message = 'Script error';
        }
        dispatch(onError(error));
      }
    }

    // Fetch
    return (
      fetch(url, typeof body === 'function' ? body() : body)
      .then(
        (response: Response) => {
          response
          .text()
          .then(
            (res2: string) => {
              if (
                response.status >= 400 &&
                response.status < 600
              ) {
                try {
                  throw JSON.parse(res2);
                }
                catch (e) {
                  throw new Error(res2);
                }
              }
              if (onReceive) {
                dispatch(onReceive(res2));
              }
            }
          )
          .catch(errorHandler);
        }
      )
      .catch(errorHandler)
    );
  };
};

asyncActionCreator.default = asyncActionCreator;
