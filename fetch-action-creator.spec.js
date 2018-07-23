const expect = require('chai').expect;
const fetchActionCreator = require('./fetch-action-creator');
require('abortcontroller-polyfill/dist/polyfill-patch-fetch');

const Response = function(status) {
  this.status = status;
};
Response.prototype.clone = function() {
  return this;
};
Response.prototype.json = () => {
  throw new Error('response.json() error');
};
Response.prototype.text = () => Promise.resolve('response.text()');

const createAbortAction = () => ({ type: 'ABORT' });
const createErrorAction = () => ({ type: 'ERROR' });
const createReceiveAction = () => ({ type: 'RECEIVE' });
const createRequestAction = (controller) => ({ type: 'REQUEST', controller });
const emptyDispatch = () => {};
const fetchError = () => Promise.reject(new Error('fetch error'));
const fetchError2 = () => Promise.resolve(new Response(404));
const fetchSuccess = () => Promise.resolve(new Response(200));
const getEmptyState = () => Object.create(null);
const INIT = { body: 'body' };
const URL = 'http://localhost/';

describe('fetchActionCreator', () => {

  it('should create a thunk action', () => {
    const action = fetchActionCreator(URL, INIT);
    expect(action).to.be.a('function');
    expect(action.length).to.equal(2);
  });

  // REQUEST
  it('should dispatch a request action', () => {
    global.fetch = fetchSuccess;
    const action = fetchActionCreator(URL, INIT, createRequestAction);
    let dispatchCalls = 0;
    const dispatch = ({ type }) => {
      dispatchCalls++;
      expect(type).to.equal('REQUEST');
    };
    return action(dispatch, getEmptyState).then(() => {
      expect(dispatchCalls).to.equal(1);
    });
  });

  // RECEIVE
  it('should dispatch a receive action', () => {
    global.fetch = fetchSuccess;
    const action = fetchActionCreator(URL, INIT, null, createReceiveAction);
    let dispatchCalls = 0;
    const dispatch = ({ type }) => {
      dispatchCalls++;
      expect(type).to.equal('RECEIVE');
    };
    return action(dispatch, getEmptyState).then(() => {
      expect(dispatchCalls).to.equal(1);
    });
  });

  // ERROR (fetch)
  it('should dispatch a fetch error action', () => {
    global.fetch = fetchError;
    const action = fetchActionCreator(URL, INIT, null, null, createErrorAction);
    let dispatchCalls = 0;
    const dispatch = ({ type }) => {
      dispatchCalls++;
      expect(type).to.equal('ERROR');
    };
    return action(dispatch, getEmptyState).then(() => {
      expect(dispatchCalls).to.equal(1);
    });
  });

  // ERROR (server)
  it('should dispatch a server error action', () => {
    global.fetch = fetchError2;
    const action = fetchActionCreator(URL, INIT, null, null, createErrorAction);
    let dispatchCalls = 0;
    const dispatch = ({ type }) => {
      dispatchCalls++;
      expect(type).to.equal('ERROR');
    };
    return action(dispatch, getEmptyState).then(() => {
      expect(dispatchCalls).to.equal(1);
    });
  });

  // ABORT
  it('should dispatch an abort action', () => {
    global.fetch = fetchSuccess;
    let resolve = () => {};
    const abortPromise = new Promise((r) => {
      resolve = r;
    });
    const action = fetchActionCreator(URL, INIT, createRequestAction, null, null, createAbortAction);
    let dispatchCalls = 0;
    const dispatch = (action) => {
      dispatchCalls++;
      if (action.type === 'REQUEST') {
        action.controller.abort();
      }
      else {
        expect(action.type).to.equal('ABORT');
        expect(dispatchCalls).to.equal(2);
        resolve();
      }
    };
    action(dispatch, getEmptyState);
    return abortPromise;
  });

  // CONDITIONAL
  it('should respect the conditional', () => {
    global.fetch = fetchSuccess;
    const action = fetchActionCreator(
      URL, INIT,
      createRequestAction, createReceiveAction,
      createErrorAction, createAbortAction,
      () => false
    );
    let dispatchCalls = 0;
    const dispatch = () => {
      dispatchCalls++;
    };
    return action(dispatch, getEmptyState).then(() => {
      expect(dispatchCalls).to.equal(0);
    });
  });
});
