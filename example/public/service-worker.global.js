"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/auth-worker/worker.js
  var require_worker = __commonJS({
    "node_modules/auth-worker/worker.js"(exports, module) {
      "use strict";
      var __defProp2 = Object.defineProperty;
      var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames2 = Object.getOwnPropertyNames;
      var __hasOwnProp2 = Object.prototype.hasOwnProperty;
      var __export = (target, all) => {
        for (var name in all)
          __defProp2(target, name, { get: all[name], enumerable: true });
      };
      var __copyProps2 = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") {
          for (let key of __getOwnPropNames2(from))
            if (!__hasOwnProp2.call(to, key) && key !== except)
              __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
        }
        return to;
      };
      var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
      var worker_exports = {};
      __export(worker_exports, {
        fetchWithCredentialRefresh: () => fetchWithCredentialRefresh,
        fetchWithCredentials: () => fetchWithCredentials,
        initAuthWorker: () => initAuthWorker2
      });
      module.exports = __toCommonJS(worker_exports);
      var STATE_PARAM_NAME = "auth-worker/state";
      var TIMEOUT = 1e4;
      function setLocalData(name, value) {
        localStorage.setItem(name, value);
      }
      function getLocalData(name) {
        return localStorage.getItem(name);
      }
      function windowMessageResponder() {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (!event.source)
            return;
          if (event.data.type === "set") {
            setLocalData(event.data.message.name, event.data.message.value);
            event.source.postMessage({ key: event.data.key });
          } else if (event.data.type === "get") {
            const value = getLocalData(event.data.message.name);
            event.source.postMessage({ key: event.data.key, value });
          }
        });
      }
      function workerSendMessage(type, message) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject();
          }, TIMEOUT);
          const key = getRandom();
          globalThis.addEventListener("message", (event) => {
            if (event.data.key === key) {
              resolve(event.data);
              clearTimeout(timeout);
            }
          });
          globalThis.postMessage({ type, key, message }, "*");
        });
      }
      async function setData(name, value) {
        await workerSendMessage("set", { name, value });
      }
      async function getData(name) {
        const data = await workerSendMessage("set", { name });
        if (data) {
          return data.value;
        }
      }
      function getRandom() {
        if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
          return globalThis.crypto.randomUUID();
        }
        return Math.random().toString(36).slice(2);
      }
      async function getState() {
        let state = await getData(STATE_PARAM_NAME);
        if (!state) {
          state = getRandom();
          await setData(STATE_PARAM_NAME, state);
        }
        return state;
      }
      windowMessageResponder();
      function generateResponse(resp, status = 200) {
        return new Response(JSON.stringify(resp), {
          headers: { "Content-Type": "application/json" },
          status
        });
      }
      var config = JSON.parse(
        decodeURIComponent(new URLSearchParams(location.search).get("config") || "{}")
      );
      var oauth2 = {
        accessToken: "",
        tokenType: "",
        expiresIn: 0,
        refreshToken: "",
        csrf: ""
      };
      var isOauth2TokenURL = (url) => (config == null ? void 0 : config.tokenUrl) === url;
      var isOauth2ProtectedResourceURL = (url) => Object.entries(new URL(url)).some(
        ([key, value]) => {
          var _a;
          return ((_a = config.filter) == null ? void 0 : _a[key]) === value;
        }
      );
      function modifyRequest(request) {
        if (isOauth2ProtectedResourceURL(request.url) && oauth2.tokenType && oauth2.accessToken) {
          const headers = new Headers(request.headers);
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `${oauth2.tokenType} ${oauth2.accessToken}`);
          }
          return new Request(request, { headers });
        }
        return request;
      }
      async function modifyResponse(response) {
        if (isOauth2TokenURL(response.url) && response.status === 200) {
          const { access_token, token_type, expires_in, refresh_token, ...payload } = await response.json();
          oauth2.accessToken = access_token;
          oauth2.tokenType = token_type;
          oauth2.expiresIn = expires_in;
          oauth2.refreshToken = refresh_token;
          return new Response(JSON.stringify(payload, null, 2), {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText
          });
        }
        return response;
      }
      async function fetchWithCredentials(input, init) {
        const request = input instanceof Request ? input : new Request(input, init);
        const response = await fetch(modifyRequest(request));
        return modifyResponse(response);
      }
      async function getAccessToken() {
        return config.tokenUrl ? fetchWithCredentials(
          new Request(config.tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              client_id: config.clientId,
              grant_type: "refreshToken",
              refreshToken: oauth2.refreshToken
            })
          })
        ) : null;
      }
      async function useRefreshToken(request, response) {
        if (isOauth2ProtectedResourceURL(response.url) && response.status === 401 && oauth2.refreshToken) {
          await getAccessToken();
          return fetchWithCredentials(request);
        }
        return response;
      }
      async function fetchWithCredentialRefresh(input, init) {
        const request = input instanceof Request ? input : new Request(input, init);
        const response = await fetchWithCredentials(request);
        return await useRefreshToken(request, response);
      }
      async function login(accessCode, state, expiresIn) {
        if (state !== await getState()) {
          return generateResponse({ error: 1 }, 400);
        }
        if (config.grantType === 1) {
          oauth2.accessToken = accessCode;
          oauth2.tokenType = "Bearer";
          oauth2.expiresIn = expiresIn || 3600;
          return generateResponse(null, 204);
        }
        const codeRequest = new Request(config.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: config.clientId,
            grant_type: "authorization_code",
            code: accessCode
          })
        });
        const response = await fetch(codeRequest);
        const responseData = await response.json();
        console.log({ responseData });
        if (response.status !== 200) {
          return generateResponse(responseData, response.status);
        } else {
          oauth2.accessToken = responseData.access_token;
          oauth2.tokenType = responseData.token_type;
          oauth2.expiresIn = responseData.expires_in;
          oauth2.refreshToken = responseData.refresh_token;
          return generateResponse(null, 204);
        }
      }
      function logout() {
        oauth2.accessToken = "";
        oauth2.tokenType = "";
        oauth2.expiresIn = 0;
        oauth2.refreshToken = "";
        return generateResponse(null, 204);
      }
      function userData() {
        if (!oauth2.accessToken) {
          return generateResponse({}, 401);
        }
        return generateResponse({}, 200);
      }
      function csrf() {
        oauth2.csrf = oauth2.csrf || getRandom();
        return generateResponse({ csrf: oauth2.csrf }, 200);
      }
      function initAuthWorker2() {
        console.log("Initializing auth worker", config);
        const fetchListener = async (event) => {
          if (event.request.url.endsWith(`${config.urlPrefix}/login`)) {
            const payload = await event.request.json();
            return event.respondWith(await login(payload.code, payload.state, payload.expiresIn));
          } else if (event.request.url.endsWith(`${config.urlPrefix}/logout`)) {
            return event.respondWith(logout());
          } else if (event.request.url.endsWith(`${config.urlPrefix}/user-data`)) {
            return event.respondWith(userData());
          } else if (event.request.url.endsWith(`${config.urlPrefix}/csrf`)) {
            return event.respondWith(csrf());
          } else if (event.request.method !== "GET") {
            const payload = await event.request.json();
            if (payload.csrf !== oauth2.csrf) {
              return event.respondWith(generateResponse({ error: 2 }, 400));
            }
            event.respondWith(fetchWithCredentials(event.request));
          } else {
            event.respondWith(fetchWithCredentialRefresh(event.request));
          }
        };
        const messageListener = async (event) => {
          if (event.data.type === "login") {
            const { code, state, expiresIn } = event.data;
            return event.ports[0].postMessage(await login(code, state, expiresIn));
          } else if (event.data.type === "logout") {
            return event.ports[0].postMessage(logout());
          } else if (event.data.type === "user-data") {
            return event.ports[0].postMessage(userData());
          } else if (event.data.type === "csrf") {
            return event.ports[0].postMessage(csrf());
          }
        };
        addEventListener("fetch", fetchListener);
        addEventListener("message", messageListener);
        return () => {
          removeEventListener("fetch", fetchListener);
          removeEventListener("message", messageListener);
        };
      }
    }
  });

  // sw/service-worker.ts
  var import_worker = __toESM(require_worker(), 1);
  addEventListener("install", () => {
    skipWaiting();
  });
  addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
  });
  (0, import_worker.initAuthWorker)();
})();
//# sourceMappingURL=service-worker.global.js.map