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

  // ../dist/worker.js
  var require_worker = __commonJS({
    "../dist/worker.js"(exports, module) {
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
        initAuthWorker: () => initAuthWorker2
      });
      module.exports = __toCommonJS(worker_exports);
      function log(...args) {
        getState().then(
          (state2) => {
            var _a;
            if ((_a = state2.config) == null ? void 0 : _a.debug) {
              console.log("[auth-worker]", ...args);
            }
          },
          () => null
        );
      }
      var state = null;
      async function getState() {
        if (!state) {
          const match = await caches.match("state");
          state = match ? await match.json() : { providers: {} };
          log("getState", state);
        }
        return state;
      }
      async function saveState() {
        const cache = await caches.open("v1");
        log("saveState", state);
        await cache.put("state", new Response(JSON.stringify(state)));
      }
      var getProviderParams = async () => {
        var _a, _b, _c, _d;
        const state2 = await getState();
        if (!((_a = state2.session) == null ? void 0 : _a.provider)) {
          throw new Error("No provider found");
        }
        const providerParams = (_d = (_b = state2.config) == null ? void 0 : _b.providers) == null ? void 0 : _d[(_c = state2.session) == null ? void 0 : _c.provider];
        if (!providerParams) {
          throw new Error("No provider params found");
        }
        return providerParams;
      };
      var getProviderOptions = async () => {
        var _a, _b, _c, _d;
        const state2 = await getState();
        if (!((_a = state2.session) == null ? void 0 : _a.provider)) {
          throw new Error("No provider found");
        }
        const providerOptions = (_d = (_b = state2.config) == null ? void 0 : _b.config) == null ? void 0 : _d[(_c = state2.session) == null ? void 0 : _c.provider];
        if (!providerOptions) {
          throw new Error("No provider options found");
        }
        return providerOptions;
      };
      function getRandom() {
        if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
          return globalThis.crypto.randomUUID();
        }
        return Math.random().toString(36).slice(2);
      }
      async function getCsrfToken() {
        const state2 = await getState();
        if (state2.csrf === null) {
          state2.csrf = getRandom();
          saveState();
        }
        return state2.csrf;
      }
      async function checkCsrfToken(token) {
        const state2 = await getState();
        return state2.csrf === token;
      }
      function generateResponse(resp, status = 200) {
        return new Response(JSON.stringify(resp), {
          headers: { "Content-Type": "application/json" },
          status
        });
      }
      async function refreshToken() {
        var _a;
        const state2 = await getState();
        const providerParams = await getProviderParams();
        const providerOptions = await getProviderOptions();
        if (!providerParams || !(providerParams == null ? void 0 : providerParams.tokenUrl) || !((_a = state2.session) == null ? void 0 : _a.refreshToken)) {
          throw new Error("No way to refresh the token");
        }
        const resp = await fetch(providerParams.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: providerOptions.clientId,
            grant_type: "refreshToken",
            refreshToken: state2.session.refreshToken
          })
        });
        if (resp.status !== 200) {
          throw new Error("Could not refresh token");
        }
        const response = await resp.json();
        state2.session = {
          provider: state2.session.provider,
          accessToken: response.access_token,
          tokenType: response.token_type,
          refreshToken: response.refresh_token,
          expiresAt: Date.now() + response.expires_in * 1e3
        };
        if (providerParams.userInfoTokenName) {
          state2.session.userInfo = response[providerParams.userInfoTokenName];
        }
        saveState();
      }
      async function fetchWithCredentials(request) {
        const state2 = await getState();
        if (!state2.session) {
          return generateResponse({ error: 3 }, 401);
        } else if (state2.session.expiresAt < Date.now()) {
          try {
            await refreshToken();
          } catch {
            return generateResponse({ error: 3 }, 401);
          }
        }
        const updatedRequest = new Request(request, {
          headers: {
            ...request.headers,
            Authorization: `${state2.session.tokenType} ${state2.session.accessToken}`,
            "X-CSRF-Token": void 0,
            "X-Use-Auth": void 0
          }
        });
        const response = await fetch(updatedRequest);
        if (response.status === 401) {
          try {
            await refreshToken();
          } catch {
            return generateResponse({ error: 3 }, 401);
          }
        }
        return response;
      }
      async function fetchListener(event) {
        if (event.request.method !== "GET") {
          const csrf = event.request.headers.get("X-CSRF-Token");
          if (!csrf || !await checkCsrfToken(csrf)) {
            return event.respondWith(generateResponse({ error: 2 }, 400));
          }
        }
        if (event.request.headers.get("X-Use-Auth")) {
          log("fetch", event.request.method, event.request.url, {
            csrf: Boolean(event.request.headers.get("X-CSRF-Token")),
            auth: Boolean(event.request.headers.get("X-Use-Auth"))
          });
          return event.respondWith(fetchWithCredentials(event.request));
        }
      }
      function e(e2) {
        this.message = e2;
      }
      e.prototype = new Error(), e.prototype.name = "InvalidCharacterError";
      var r = "undefined" != typeof window && window.atob && window.atob.bind(window) || function(r2) {
        var t2 = String(r2).replace(/=+$/, "");
        if (t2.length % 4 == 1)
          throw new e("'atob' failed: The string to be decoded is not correctly encoded.");
        for (var n2, o2, a = 0, i = 0, c = ""; o2 = t2.charAt(i++); ~o2 && (n2 = a % 4 ? 64 * n2 + o2 : o2, a++ % 4) ? c += String.fromCharCode(255 & n2 >> (-2 * a & 6)) : 0)
          o2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(o2);
        return c;
      };
      function t(e2) {
        var t2 = e2.replace(/-/g, "+").replace(/_/g, "/");
        switch (t2.length % 4) {
          case 0:
            break;
          case 2:
            t2 += "==";
            break;
          case 3:
            t2 += "=";
            break;
          default:
            throw "Illegal base64url string!";
        }
        try {
          return function(e3) {
            return decodeURIComponent(r(e3).replace(/(.)/g, function(e4, r2) {
              var t3 = r2.charCodeAt(0).toString(16).toUpperCase();
              return t3.length < 2 && (t3 = "0" + t3), "%" + t3;
            }));
          }(t2);
        } catch (e3) {
          return r(t2);
        }
      }
      function n(e2) {
        this.message = e2;
      }
      function o(e2, r2) {
        if ("string" != typeof e2)
          throw new n("Invalid token specified");
        var o2 = true === (r2 = r2 || {}).header ? 0 : 1;
        try {
          return JSON.parse(t(e2.split(".")[o2]));
        } catch (e3) {
          throw new n("Invalid token specified: " + e3.message);
        }
      }
      n.prototype = new Error(), n.prototype.name = "InvalidTokenError";
      var jwt_decode_esm_default = o;
      async function createSession(params, provider, localState) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
        const state2 = await getState();
        const parsedParams = new URLSearchParams(params);
        if (!state2.config) {
          throw new Error("No config found");
        }
        const providerParams = (_a = state2.config.providers) == null ? void 0 : _a[provider];
        const providerOptions = (_b = state2.config.config) == null ? void 0 : _b[provider];
        if (!providerParams) {
          throw new Error("No provider params found");
        }
        const stateParam = parsedParams.get((_c = providerParams.stateParam) != null ? _c : "state");
        if (stateParam !== localState) {
          throw new Error("Invalid state");
        }
        if (providerParams.grantType === 1) {
          const expiresIn = parseInt((_e = parsedParams.get((_d = providerParams.expiresInName) != null ? _d : "expires_in")) != null ? _e : "", 10) || 3600;
          const accessToken = parsedParams.get((_f = providerParams.accessTokenName) != null ? _f : "access_token");
          if (!accessToken) {
            throw new Error("No access token found");
          }
          state2.session = {
            provider,
            accessToken,
            userInfo: providerParams.userInfoTokenName ? (_g = parsedParams.get(providerParams.userInfoTokenName)) != null ? _g : void 0 : void 0,
            tokenType: (_i = parsedParams.get((_h = providerParams.tokenTypeName) != null ? _h : "token_type")) != null ? _i : "Bearer",
            expiresAt: Date.now() + expiresIn * 1e3
          };
          log("state", state2);
        }
        if (providerParams.grantType === 0) {
          const accessCode = parsedParams.get((_j = providerParams.authorizationCodeParam) != null ? _j : "code");
          if (!accessCode) {
            throw new Error("No access code found");
          }
          const res = await fetch(providerParams.tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              client_id: providerOptions.clientId,
              grant_type: "authorization_code",
              code: accessCode
            })
          });
          if (res.status !== 200) {
            throw new Error("Could not get token");
          }
          const response = await res.json();
          const expiresIn = response[(_k = providerParams.expiresInName) != null ? _k : ""] || 3600;
          const accessToken = response[(_l = providerParams.accessTokenName) != null ? _l : "access_token"];
          if (!accessToken) {
            throw new Error("No access token found");
          }
          state2.session = {
            provider,
            accessToken,
            tokenType: (_n = response[(_m = providerParams.tokenTypeName) != null ? _m : "token_type"]) != null ? _n : "Bearer",
            refreshToken: response[(_o = providerParams.refreshTokenName) != null ? _o : ""],
            userInfo: response[(_p = providerParams.userInfoTokenName) != null ? _p : ""],
            expiresAt: Date.now() + expiresIn * 1e3
          };
          log("state", state2);
        }
        saveState();
        return getUserData();
      }
      async function getUserData() {
        var _a, _b, _c, _d;
        const state2 = await getState();
        if (!state2.session) {
          log("state", state2);
          throw new Error("No session found");
        }
        const providerParams = (_b = (_a = state2.config) == null ? void 0 : _a.providers) == null ? void 0 : _b[state2.session.provider];
        if (state2.session.userInfo) {
          const decoded = jwt_decode_esm_default(state2.session.userInfo);
          return ((_c = providerParams == null ? void 0 : providerParams.userInfoParser) == null ? void 0 : _c.call(providerParams, decoded)) || decoded;
        } else if (providerParams == null ? void 0 : providerParams.userInfoUrl) {
          const resp = await fetch(providerParams.userInfoUrl, {
            headers: {
              Authorization: `${state2.session.tokenType} ${state2.session.accessToken}`
            }
          });
          if (resp.status !== 200) {
            throw new Error("Could not get user info");
          }
          const response = await resp.json();
          return ((_d = providerParams == null ? void 0 : providerParams.userInfoParser) == null ? void 0 : _d.call(providerParams, response)) || response;
        }
        throw new Error("No way to get user info");
      }
      async function deleteSession() {
        const state2 = await getState();
        state2.session = void 0;
        saveState();
      }
      var operations = {
        getCsrfToken,
        createSession,
        getUserData,
        deleteSession
      };
      async function messageListener(event) {
        var _a, _b;
        log("message", event.data.type, event.data.fnName);
        if (event.data.type === "call") {
          if (event.data.fnName in operations) {
            const fn = operations[event.data.fnName];
            try {
              const result = await fn(...event.data.options);
              (_a = event.source) == null ? void 0 : _a.postMessage({ key: event.data.caller, result });
            } catch (error) {
              (_b = event.source) == null ? void 0 : _b.postMessage({ key: event.data.caller, error: error.message });
            }
          }
        }
      }
      var config = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("config") || "{}"));
      var debug = new URLSearchParams(location.search).get("debug") === "1";
      async function initAuthWorker2(providers) {
        const state2 = await getState();
        state2.config = {
          config,
          providers,
          debug
        };
        const scope = globalThis;
        state2.providers = providers;
        log("init", state2.config);
        scope.addEventListener("fetch", fetchListener);
        scope.addEventListener("message", messageListener);
        return () => {
          scope.removeEventListener("fetch", fetchListener);
          scope.removeEventListener("message", messageListener);
        };
      }
    }
  });

  // ../dist/providers.js
  var require_providers = __commonJS({
    "../dist/providers.js"(exports, module) {
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
      var providers_exports = {};
      __export(providers_exports, {
        google: () => google2
      });
      module.exports = __toCommonJS(providers_exports);
      var google2 = {
        loginUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        grantType: 1,
        accessTokenName: "access_token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
        userInfoTokenName: "id_token",
        userInfoParser(data) {
          return {
            id: data.sub,
            name: data.name,
            email: data.email,
            picture: data.picture
          };
        }
      };
    }
  });

  // sw/service-worker.ts
  var import_worker = __toESM(require_worker(), 1);
  var import_providers = __toESM(require_providers(), 1);
  addEventListener("install", () => {
    skipWaiting();
  });
  addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
  });
  (0, import_worker.initAuthWorker)({ google: import_providers.google });
})();
//# sourceMappingURL=service-worker.global.js.map