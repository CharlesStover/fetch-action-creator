import { ActionCreator, AnyAction } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

export interface ThunkActionCreator {
  default?: ThunkActionCreator;
  (
    url: string,
    body: Body,
    createRequestAction: OptionalRequestActionCreator,
    createReceiveAction: OptionalActionCreator,
    createErrorAction: OptionaErrorActionCreator,
    createAbortAction: OptionalActionCreator,
    conditional: OptionalConditional
  ): AsyncAction;
}

export type Conditional = (state: any) => boolean;

export type ErrorActionCreator = (error?: string) => AnyAction;

export type ReceiveActionCreator = (content?: Object | string, headers?: Headers) => AnyAction;

export type RequestActionCreator = (abortController?: AbortController | null) => AnyAction;

type AsyncAction = ThunkAction<Promise<void>, any, void, AnyAction>;
type AsyncDispatch = ThunkDispatch<any, void, AnyAction>;
type Body = any | (() => any);
type OptionalActionCreator = ActionCreator<AnyAction> | null;
type OptionalConditional = Conditional | null;
type OptionaErrorActionCreator = ErrorActionCreator | null;
type OptionalReceiveActionCreator = ReceiveActionCreator | null;
type OptionalRequestActionCreator = RequestActionCreator | null;
type StateGetter = () => any;

const MIN_ERROR_STATUS: number = 400;
const MAX_ERROR_STATUS: number = 600;

const parseJsonOrText = (res: Response): Promise<Object | string> => {
  const res2 = res.clone();
  try {
    return res2.json();
  }
  catch (e) {
    return res.text();
  }
};

export const asyncActionCreator: ThunkActionCreator = (
  url: string,
  body: Body = {},
  createRequestAction: OptionalRequestActionCreator = null,
  createReceiveAction: OptionalReceiveActionCreator = null,
  createErrorAction: OptionalActionCreator = null,
  createAbortAction: OptionalActionCreator = null,
  conditional: OptionalConditional = null
): AsyncAction =>
  (dispatch: AsyncDispatch, getState: StateGetter): Promise<void> => {

    // If we have a condition for fetching, check if we should continue.
    if (
      conditional &&
      !conditional(getState())
    ) {
      return Promise.resolve();
    }

    // Implement AbortController, where possible.
    let abortController = null;
    let signal = null;
    if (typeof AbortController !== 'undefined') {
      abortController = new AbortController();
      signal = abortController.signal;

      if (createAbortAction) {
        signal.addEventListener('abort', () => {
          dispatch(createAbortAction());
        });
      }
    }

    // Error Handler
    const errorHandler = (e: Error) => {

      // If there is an action for this error, dispatch it.
      if (createErrorAction) {
        dispatch(createErrorAction(
          typeof e === 'string' ?
            e :
            e.message ?
              e.message :
              'Script error'
        ));
      }
  
      // Log the error to the console.
      if (
        typeof e === 'object' &&
        Object.prototype.hasOwnProperty.call(e, 'stack')
      ) {
        console.error(e.stack);
      }
    };

    // Action: Requesting data.
    if (createRequestAction) {
      dispatch(createRequestAction(abortController));
    }

    // Fetch
    return (
      fetch(url, {
        signal,
        ...typeof body === 'function' ? body() : body
      })
        .then(
          (response: Response): void => {
            parseJsonOrText(response)
              .then(
                (content: Object | string): void => {

                  // Check for an error status code.
                  if (
                    response.status >= 400 &&
                    response.status < 600
                  ) {
                    throw new Error(
                      typeof content === 'string' ?
                        content :
                        JSON.stringify(content)
                    );
                  }

                  // Dispatch that we have received this request.
                  if (createReceiveAction) {
                    dispatch(createReceiveAction(content, response.headers));
                  }
                }
              )
              .catch(errorHandler);
          }
        )
        .catch(errorHandler)
    );
  };

asyncActionCreator.default = asyncActionCreator;
