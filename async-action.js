'use strict';

require('whatwg-fetch');

var asyncActionCreator = function(url) {
  var body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var onRequest = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var onReceive = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var onError = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  var cont = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

  return function (dispatch, getState) {

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
    var errorHandler = function errorHandler(error) {
      if (onError) {
        if (!error.message) {
          error.message = 'Script error';
        }
        dispatch(onError(error));
      }
    };

    // Fetch
    return fetch(url, typeof body === 'function' ? body() : body).then(function (response) {
      response.text().then(function (res2) {
        if (response.status >= 400 && response.status < 600) {
          try {
            throw JSON.parse(res2);
          } catch (e) {
            throw new Error(res2);
          }
        }
        if (onReceive) {
          dispatch(onReceive(res2));
        }
      }).catch(errorHandler);
    }).catch(errorHandler);
  };
};

asyncActionCreator.default = asyncActionCreator;

module.exports = asyncActionCreator;
