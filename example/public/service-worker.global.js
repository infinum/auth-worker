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
      var config = JSON.parse(new URLSearchParams(location.search).get("config") || "{}");
      var oauth2 = {
        accessToken: "",
        tokenType: "",
        expiresIn: 0,
        refreshToken: ""
      };
      var isOauth2TokenURL = (url) => config.tokenUrl === url;
      var isOauth2ProtectedResourceURL = (url) => Object.entries(new URL(url)).some(([key, value]) => {
        var _a;
        return ((_a = config.filter) == null ? void 0 : _a[key]) === value;
      });
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
        return fetchWithCredentials(
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
        );
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
      function initAuthWorker2() {
        const listener = (event) => {
          if (event.request.url.endsWith(`${config.urlPrefix}/login`)) {
          } else if (event.request.url.endsWith(`${config.urlPrefix}/logout`)) {
          } else if (event.request.url.endsWith(`${config.urlPrefix}/user-data`)) {
          } else {
            event.respondWith(fetchWithCredentialRefresh(event.request));
          }
        };
        addEventListener("fetch", listener);
        return () => removeEventListener("fetch", listener);
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