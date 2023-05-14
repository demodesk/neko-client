/* tslint:disable */
/* eslint-disable */
/**
 * n.eko REST API
 * Next Gen Renderer.
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import type { Configuration } from '../configuration';
import type { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from '../common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from '../base';
// @ts-ignore
import { ErrorMessage } from '../models';
// @ts-ignore
import { SessionData } from '../models';
// @ts-ignore
import { SessionLogin } from '../models';
/**
 * SessionApi - axios parameter creator
 * @export
 */
export const SessionApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary login
         * @param {SessionLogin} sessionLogin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        login: async (sessionLogin: SessionLogin, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'sessionLogin' is not null or undefined
            assertParamExists('login', 'sessionLogin', sessionLogin)
            const localVarPath = `/api/login`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(sessionLogin, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary logout
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        logout: async (options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/logout`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication CookieAuth required

            // authentication TokenAuth required
            await setApiKeyToObject(localVarQueryParameter, "token", configuration)

            // authentication BearerAuth required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary whoami
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        whoami: async (options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
            const localVarPath = `/api/whoami`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication CookieAuth required

            // authentication TokenAuth required
            await setApiKeyToObject(localVarQueryParameter, "token", configuration)

            // authentication BearerAuth required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * SessionApi - functional programming interface
 * @export
 */
export const SessionApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = SessionApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary login
         * @param {SessionLogin} sessionLogin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async login(sessionLogin: SessionLogin, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SessionData>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.login(sessionLogin, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary logout
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async logout(options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.logout(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary whoami
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async whoami(options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SessionData>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.whoami(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * SessionApi - factory interface
 * @export
 */
export const SessionApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = SessionApiFp(configuration)
    return {
        /**
         * 
         * @summary login
         * @param {SessionLogin} sessionLogin 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        login(sessionLogin: SessionLogin, options?: any): AxiosPromise<SessionData> {
            return localVarFp.login(sessionLogin, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary logout
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        logout(options?: any): AxiosPromise<void> {
            return localVarFp.logout(options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary whoami
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        whoami(options?: any): AxiosPromise<SessionData> {
            return localVarFp.whoami(options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * SessionApi - object-oriented interface
 * @export
 * @class SessionApi
 * @extends {BaseAPI}
 */
export class SessionApi extends BaseAPI {
    /**
     * 
     * @summary login
     * @param {SessionLogin} sessionLogin 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public login(sessionLogin: SessionLogin, options?: AxiosRequestConfig) {
        return SessionApiFp(this.configuration).login(sessionLogin, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary logout
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public logout(options?: AxiosRequestConfig) {
        return SessionApiFp(this.configuration).logout(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary whoami
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SessionApi
     */
    public whoami(options?: AxiosRequestConfig) {
        return SessionApiFp(this.configuration).whoami(options).then((request) => request(this.axios, this.basePath));
    }
}
