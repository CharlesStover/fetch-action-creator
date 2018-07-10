# thunk-action-creator
Creates standardized, four-part asynchronous actions for redux-thunk.

Dispatch a single, asynchronous action for fetching a request, and your redux store will receive corresponding actions when the request (1) dispatches, (2) receives a response, (3) encounters an error, and/or (4) is aborted.

## Install
`npm install thunk-action-creator --save` or `yarn add thunk-action-creator`

Your redux store must be using the `thunk` middleware.

## Use
```JS
import thunkActionCreator from 'thunk-action-creator';
const myFetchAction = () =>
  thunkActionCreator(
    url,
    requestInit,
    createRequestAction,
    createReceiveAction,
    createErrorAction,
    createAbortAction,
    conditional
  );

dispatch(myFetchAction()) // fetches url, dispatching asynchronous actions
```

## Example
```JS
import thunkActionCreator from 'thunk-action-creator';
const fetchEmployees = () =>
  thunkActionCreator(

    // URL to request.
    'https://my.business.com/employees.json',

    // Fetch options.
    {
      body: 'please',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      },
      method: 'GET'
    },

    // Action for when the request has dispatched.
    (abortController) => ({
      type: 'REQUEST_EMPLOYEES',
      abortController
    }),

    // Action for when the server has responded.
    (employees) => ({
      type: 'RECEIVE_EMPLOYEES',
      employees
    }),

    // Action for when an error has occurred.
    (err, statusCode) => ({
      type: 'EMPLOYEES_ERROR',
      error: err,
      statusCode
    }),

    // Action for when the request has been aborted.
    () => ({
      type: 'ABORT_EMPLOYEES'
    }),

    // Conditional function for when to disregard this action entirely.
    (state) => {

      // Don't fetch twice.
      if (
        state.employees.isFetching ||
        Array.isArray(state.employees.list)
      ) {
        return false;
      }

      return true;
    }
  );
```

## Parameters

* ### url: string
  The URL to which you are dispatching a fetch request.

* ### requestInit: any
  The fetch options which you are including in your fetch request _or_ a function that returns said options.

* ### createRequestAction: (abortController: AbortController | null) => AnyAction
  An action creator that is called when your fetch request has been dispatched.
  #### Parameters
  * ##### abortController: AbortController | null
    An AbortController instance that controls that abort signal for the fetch request.

    If you desire to abort any of your fetch requests, you should store this instance in your redux state.

    If the user's browser does not support aborting requests, the value will be `null`.

* ### createReceiveAction: (content: Object | string, statusCode: number, headers: Headers) => AnyAction
  An action creator that is called when your fetch request has received a response.
  #### Parameters
  * ##### content: Object | string
    A JavaScript object or string with which the server responded to the request.
  * ##### statusCode: number
    The status code with which the server responded to the request.
  * ##### headers: Headers
    An instance of `Headers` that contains the headers with which the server responded to the request.

* ### createErrorAction: (error: string, statusCode: null | number) => AnyAction
  An action creator that is called when an error occurs.
  #### Parameters
  * ##### error: string
    A string containing the error message. This may be either a JavaScript error or the response from the server.
  * ##### statusCode: null | number
    The status code with which the server responded to the request. If no status code exists (such as during a JavaScript error), the value is `null`.

* ### createAbortAction: () => AnyAction
  An action creator that is called when the fetch request is aborted.

  _See also:_ createRequestAction / Parameters / abortController

* ### conditional: (state: any) => boolean
  If present, this function is called prior to the fetch request.

  If it returns true, the fetch request will continue. If it returns false, the entire asynchronous action will be ignored.
  #### Parameters
  * ##### state: any
    Your current redux state.
