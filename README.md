# fetch-action-creator
Fetches using standardized, four-part asynchronous actions for redux-thunk.

Dispatch a single, asynchronous action that fetches a request, and your redux store will receive corresponding actions when your fetch API (1) requests, (2) resolves a response, (3) rejects an error, and/or (4) is aborted.

[![package](https://img.shields.io/github/package-json/v/CharlesStover/fetch-action-creator.svg)](https://github.com/CharlesStover/fetch-action-creator/)
[![build](https://travis-ci.com/CharlesStover/fetch-action-creator.svg)](https://travis-ci.com/CharlesStover/fetch-action-creator/)
[![downloads](https://img.shields.io/npm/dt/fetch-action-creator.svg)](https://www.npmjs.com/package/fetch-action-creator)
[![minified size](https://img.shields.io/bundlephobia/min/fetch-action-creator.svg)](https://www.npmjs.com/package/fetch-action-creator)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/fetch-action-creator.svg)](https://www.npmjs.com/package/fetch-action-creator)

## Install
* `npm install fetch-action-creator --save` or
* `yarn add fetch-action-creator`

Your redux store must be using the `redux-thunk` middleware.

## Basic Example
```JS
import fetchActionCreator from 'fetch-action-creator';

const fetchEmployees = () =>
  fetchActionCreator(

    // Included in the action types received by your redux store.
    'EMPLOYEES',

    // URL to fetch.
    'https://my.business.com/employees.json'
  );
```
The above example will send a `REQUEST_EMPLOYEES` action to the redux store, followed by one of the following: `ABORT_EMPLOYEES` if the request was aborted, `REJECT_EMPLOYEES` if an error occurred, or `RESOLVE_EMPLOYEES` if the data was received successfully.

See the documentation for a list of action properties.

## Advanced Example
```JS
import fetchActionCreator from 'fetch-action-creator';

// We want to include an employee's name in the fetch request.
const fetchAddEmployee = name =>
  fetchActionCreator(

    // Included in the action types received by your redux store.
    'ADD_EMPLOYEE',

    // URL to fetch.
    'https://my.business.com/employees.json',

    // Fetch options are configurable.
    {
      body: name,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      },
      method: 'POST'
    }

    // Action mutators can change the default actions sent to the redux reducers.
    {

      // An object mutator will EXTEND the default action sent to the redux reducer.
      // The abort action will now have a name property equal to the one passed to fetchAddEmployee.
      onAbort: { name }

      // The reject action will now have a name property equal to the one passed to fetchAddEmployee
      //    and a timestamp property equal to the time that the error occurred.
      onReject: {
        name,
        timestamp: Date.now()
      },

      // A function mutator will RECEIVE the default action sent and mutate it before passing it to the redux reducer.
      // The request action will now have a name property equal to the one passed to fetchAddEmployee.
      onRequest: requestAction => ({
        ...requestAction,
        name
      }),

      // The resolve action will now have a name property equal to the one passed to fetchAddEmployee
      //    and a timestamp property equal to the time that the error occurred.
      // You may mutate the action however you want.
      onResolve: resolveAction => {
        resolveAction.timestamp = Date.now();
        if (name.endsWith('*')) {
          resolveAction.type = 'RESOLVE_ADD_MANAGER';
        }
        return {
          ...resolveAction,
          name
        };
      }
    },

    // A conditional function will prevent the fetch request if it returns false.
    // The conditional function receives the current redux state as a parameter.
    state => {

      // If this request is already loading (handled in the reducer),
      //    don't make the same request again.
      if (state.employees[name].status === 'loading') {
        return false;
      }

      // People named Bob aren't allowed to work here.
      if (name === 'Bob') {
        return false;
      }

      // Allow the addition of anyone else.
      return true;
    }
  );
```

## Parameters

* ### id: string

  An ID used to generate the types for each dispatched action.

  _Example:_ An ID of `ADD_EMPLOYEE` will dispatch the actions `REQUEST_ADD_EMPLOYEE`, `RESOLVE_ADD_EMPLOYEE`, `REJECT_ADD_EMPLOYEE`, and `ABORT_ADD_EMPLOYEE`.

* ### url: string

  The URL to which you are dispatching a fetch request.
  
  _See also:_ [fetch parameters](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) on MDN

* ### init: null | RequestInit | (state?: Object) => RequestInit

  The fetch options which you are including in your fetch request _or_ a function that returns said options, taking the current state as a parameter.
  
  _See also:_ [fetch parameters](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) on MDN

  _Default:_ Empty object.

* ### actions: Actions | null

  An object of action mutators that will change the default actions that are dispatched to the redux reducers.

  The keys of this object may be:
  * `onAbort`, which is used when your fetch request is aborted
  * `onReject`, which is used when your fetch request encountered an error
  * `onRequest`, which is used when your fetch request has been initiated
  * `onResolve`, which is used whe nyour fetch request has resolved successfully

  The values of this object may be an object, which will be _merged_ with the default action.

  ```JS
  {
    onAbort: { myKey: 'myValue' }
  }
  // creates
  {
    myKey: 'myValue',
    type: 'ABORT_ID'
  }
  ```

  The values of this object may alternatively be a function, which will receive the default action and return a changed action.

  ```JS
  {
    onAbort: abortAction => ({
      type: abortAction.type.split('').reverse().join('')
    })
  }
  // creates
  {
    type: 'DI_TROBA'
  }
  ```

  #### Action properties

  * `onAbort`

    * _no additional properties_

  * `onReject`

    * `error` contains a string with the error message. This may be either a JavaScript error or server response.

    * `statusCode` contains an integer value of the response status code, e.g. `404`.

  * `onRequest`
  
    * `abortController` contains an [AbortController instance](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

      If you desire to abort any of your fetch requests, you should store this instance in your redux state.

      If the user's browser does not support aborting requests, the value will be `null`.

  * `onResolve`

    * `body` contains the body of the response. This can be a JavaScript object or string.

    * `headers` contains an instance of `Headers` with which the server responded to the request.

    * `statusCode` contains an integer value of the response status code, e.g. `200`.

* ### conditional?: (state: Object) => boolean

  If present, this function is called prior to the fetch request.

  If it returns true, the fetch request will continue. If it returns false, the entire asynchronous action will be ignored.

  The parameter of this function is a current snapshot of your redux state.
