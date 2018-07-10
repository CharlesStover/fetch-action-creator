# thunk-action-creator
Creates standardized, four-part asynchronous actions for redux-thunk.

## Use
```JS
import thunkActionCreator from 'thunk-action-creator';
const thunkAction = thunkActionCreator(
  url,
  body,
  createRequestAction,
  createReceiveAction,
  createErrorAction,
  createAbortAction,
  conditional
);
```

## Parameters

* ### url: string
  The URL to which you are dispatching a fetch request.

* ### body: any
  The contents which you are including in your fetch request _or_ a function that returns said contents.

* ### createRequestAction: (abortController: AbortController | null) => AnyAction
  An action creator that is called when your fetch request has been dispatched.
  #### Parameters
  * ##### abortController: AbortController | null
    An AbortController instance that controls that abort signal for the fetch request.

    If you desire to abort any of your fetch requests, you should store this instance in your redux state.

    If the user's browser does not support aborting requests, the value will be `null`.

* ### createReceiveAction: (content: Object | string, headers: Headers) => AnyAction
  An action creator that is called when your fetch request has received a response.
  #### Parameters
  * ##### content: Object | string
    A JavaScript object or string with which the server responded to the request.
  * ##### headers: Headers
    An instance of `Headers` that contains the headers with which the server responded to the request.

* ### createErrorAction: (error: string) => AnyAction
  An action creator that is called when an error occurs.
  #### Parameters
  * ##### error: string
    A string containing the error message. This may be either a JavaScript error or the response from the server.

* ### createAbortAction: () => AnyAction
  An action creator that is called when the fetch request is aborted.

  _See also:_ createRequestAction / Parameters / abortController

* ### conditional: (state: any) => boolean
  If present, this function is called prior to the fetch request.

  If it returns true, the fetch request will continue. If it returns false, the entire asynchronous action will be ignored.
  #### Parameters
  * ##### state: any
    Your current redux state.
