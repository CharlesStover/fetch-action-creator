const MIN_ERROR_STATUS = 400;
const MAX_ERROR_STATUS = 600;
const parseJsonOrText = (res) => {
    const res2 = res.clone();
    try {
        return res2.json();
    }
    catch (e) {
        return res.text();
    }
};
const thunkActionCreator = (url, body = {}, createRequestAction = null, createReceiveAction = null, createErrorAction = null, createAbortAction = null, conditional = null) => (dispatch, getState) => {
    // If we have a condition for fetching, check if we should continue.
    if (conditional &&
        !conditional(getState())) {
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
    const errorHandler = (e) => {
        // If there is an action for this error, dispatch it.
        if (createErrorAction) {
            dispatch(createErrorAction(typeof e === 'string' ?
                e :
                e.message ?
                    e.message :
                    'Script error'));
        }
        // Log the error to the console.
        if (typeof e === 'object' &&
            Object.prototype.hasOwnProperty.call(e, 'stack')) {
            console.error(e.stack);
        }
    };
    // Action: Requesting data.
    if (createRequestAction) {
        dispatch(createRequestAction(abortController));
    }
    // Fetch
    return (fetch(url, Object.assign({ signal }, typeof body === 'function' ? body() : body))
        .then((response) => {
        parseJsonOrText(response)
            .then((content) => {
            // Check for an error status code.
            if (response.status >= 400 &&
                response.status < 600) {
                throw new Error(typeof content === 'string' ?
                    content :
                    JSON.stringify(content));
            }
            // Dispatch that we have received this request.
            if (createReceiveAction) {
                dispatch(createReceiveAction(content, response.headers));
            }
        })
            .catch(errorHandler);
    })
        .catch(errorHandler));
};
thunkActionCreator.default = thunkActionCreator;
module.exports = thunkActionCreator;
