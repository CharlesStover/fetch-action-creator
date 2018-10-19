import { AnyAction } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

export interface AbortAction {
  type: string;
}

export type ActionMutator<A extends FetchStateAction> = (action: A) => AnyAction;

export interface Actions {
  onAbort?: ActionMutator<AbortAction> | Object;
  onReject?: ActionMutator<RejectAction> | Object;
  onRequest?: ActionMutator<RequestAction> | Object;
  onResolve?: ActionMutator<ResolveAction> | Object;
}

interface Conditional {
  (state: Object): boolean;
}

type FetchAction = ThunkAction<Promise<void>, any, void, AnyAction>;

export interface FetchActionCreator {
  default?: FetchActionCreator;
  (
    id: string,
    input: Request | string,
    init: Init,
    actions: Actions,
    conditional?: Conditional
  ): FetchAction;
}

type FetchStateAction = AbortAction | RejectAction | RequestAction | ResolveAction;

type Init = RequestInit | ((state?: Object) => RequestInit);

export interface RejectAction {
  error: Object | string;
  headers: Headers | null,
  statusCode: null | number;
  type: string;
}

export interface RequestAction {
  abortController: AbortController | null;
  type: string;
}

export interface ResolveAction {
  body: Object | string;
  headers: Headers;
  statusCode: number;
  type: string;
}



class FetchError extends Error {
  headers: Headers;
  originalMessage: Object | string;
  statusCode: number;

  constructor(message: Object | string, headers: Headers, statusCode: number) {
    if (typeof message === 'string') {
      super(message);
    }
    else {
      super(JSON.stringify(message));
    }
    this.headers = headers;
    this.originalMessage = message;
    this.statusCode = statusCode;
  }
}

const MIN_ERROR_STATUS_CODE: number = 400;
const MAX_ERROR_STATUS_CODE: number = 600;

const createAction = (action: FetchStateAction, actionMutator?: ActionMutator<FetchStateAction> | null | Object): AnyAction => {
  if (!actionMutator) {
    return action;
  }
  if (typeof actionMutator === 'object') {
    return {
      ...action,
      ...actionMutator
    };
  }
  return actionMutator(action);
};

const parseResponse = (response: Response): Promise<[ Object | string, Headers, number ]> => {
  const includeMeta = <T = Object | string>(result: T): [ T, Headers, number ] => [ result, response.headers, response.status ];
  const response2 = response.clone();
  try {
    return response2.json().then(includeMeta);
  }
  catch (e) {
    return response.text().then(includeMeta);
  }
};

const fetchActionCreator: FetchActionCreator = (
  id: string,
  url: Request | string,
  init: Init | null = Object.create(null),
  actions: Actions | null = Object.create(null),
  conditional?: Conditional
): FetchAction =>
  (dispatch: ThunkDispatch<any, void, AnyAction>, getState: () => Object): Promise<void> => {

    // If we have a condition for fetching, check if we should continue.
    if (
      typeof conditional === 'function' &&
      !conditional(getState())
    ) {
      return Promise.resolve();
    }

    // Implement AbortController, where possible.
    let abortController: AbortController | null = null;
    let signal: AbortSignal | null = null;

    // If this browser supports AbortController, create one.
    if (typeof AbortController !== 'undefined') {
      abortController = new AbortController();
      signal = abortController.signal;

      // When the signal aborts, dispatch the abort action.
      signal.addEventListener('abort', () => {
        const abortAction: AbortAction = {
          type: 'ABORT_' + id
        };
        dispatch(createAction(
          abortAction,
          actions !== null &&
          Object.prototype.hasOwnProperty.call(actions, 'onAbort') ?
            actions.onAbort :
            null
        ));
      });
    }

    // Dispatch the request action.
    const requestAction: RequestAction = {
      abortController,
      type: 'REQUEST_' + id
    };
    dispatch(createAction(
      requestAction,
      actions !== null &&
      Object.prototype.hasOwnProperty.call(actions, 'onRequest') ?
        actions.onRequest :
        null
    ));

    // Fetch
    const requestInit: null | RequestInit =
      typeof init === 'function' ?
        init.length ?
          init(getState()) :
          init() :
        init;
    return fetch(url, { signal, ...requestInit })
      .then(parseResponse)
      .then(([ body, headers, statusCode ]: [ Object | string, Headers, number ]) => {

        // Check for an error status code.
        if (
          statusCode >= MIN_ERROR_STATUS_CODE &&
          statusCode < MAX_ERROR_STATUS_CODE
        ) {
          throw new FetchError(body, headers, statusCode);
        }

        // Dispatch the resolve action.
        const resolveAction: ResolveAction = {
          body,
          headers,
          statusCode,
          type: 'RESOLVE_' + id
        };
        dispatch(createAction(
          resolveAction,
          actions !== null &&
          Object.prototype.hasOwnProperty.call(actions, 'onResolve') ?
            actions.onResolve :
            null
        ));
      })

      // Dispatch the reject action.
      .catch((err: Error | FetchError) => {
        const rejectAction: RejectAction = {
          error:
            err instanceof FetchError ?
              err.originalMessage :
              Object.prototype.hasOwnProperty.call(err, 'message') ?
                err.message :
                'Script error',
          headers:
            err instanceof FetchError ?
              err.headers :
              null,
          statusCode:
            err instanceof FetchError ?
              err.statusCode :
              null,
          type: 'REJECT_' + id
        };
        dispatch(createAction(
          rejectAction,
          actions !== null &&
          Object.prototype.hasOwnProperty.call(actions, 'onReject') ?
            actions.onReject :
            null
        ));
      });
  };

fetchActionCreator.default = fetchActionCreator;

module.exports = fetchActionCreator;
