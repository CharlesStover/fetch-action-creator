import { ActionCreator, AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
export interface FetchActionCreator {
    default?: FetchActionCreator;
    (url: string, requestInit: Init, createRequestAction: OptionalRequestActionCreator, createReceiveAction: OptionalReceiveActionCreator, createErrorAction: OptionaErrorActionCreator, createAbortAction: OptionalActionCreator, conditional: OptionalConditional): FetchAction;
}
export declare type Conditional = (state: any) => boolean;
export declare type ErrorActionCreator = (error?: string, statusCode?: null | number) => AnyAction;
export declare type ReceiveActionCreator = (content?: Object | string, statusCode?: number, headers?: Headers) => AnyAction;
export interface ReceiveMetadata {
    headers: Headers;
    statusCode: number;
}
export declare type RequestActionCreator = (abortController?: AbortController | null) => AnyAction;
declare type FetchAction = ThunkAction<Promise<void>, any, void, AnyAction>;
declare type Init = RequestInit | (() => RequestInit);
declare type OptionalActionCreator = ActionCreator<AnyAction> | null;
declare type OptionalConditional = Conditional | null;
declare type OptionaErrorActionCreator = ErrorActionCreator | null;
declare type OptionalReceiveActionCreator = ReceiveActionCreator | null;
declare type OptionalRequestActionCreator = RequestActionCreator | null;
export {};
