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
      var state = {
        providers: {}
      };
      function getRandom() {
        if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
          return globalThis.crypto.randomUUID();
        }
        return Math.random().toString(36).slice(2);
      }
      function getCsrfToken() {
        if (state.csrf === null) {
          state.csrf = getRandom();
        }
        return state.csrf;
      }
      function checkCsrfToken(token) {
        return state.csrf === token;
      }
      function generateResponse(resp, status = 200) {
        return new Response(JSON.stringify(resp), {
          headers: { "Content-Type": "application/json" },
          status
        });
      }
      async function refreshToken() {
        var _a, _b, _c, _d, _e, _f, _g;
        const providerParams = (_c = (_a = state.config) == null ? void 0 : _a.providers) == null ? void 0 : _c[(_b = state.session) == null ? void 0 : _b.provider];
        const providerOptions = (_f = (_d = state.config) == null ? void 0 : _d.config) == null ? void 0 : _f[(_e = state.session) == null ? void 0 : _e.provider];
        if (!providerParams || !(providerParams == null ? void 0 : providerParams.tokenUrl) || !((_g = state.session) == null ? void 0 : _g.refreshToken)) {
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
            refreshToken: state.session.refreshToken
          })
        });
        if (resp.status !== 200) {
          throw new Error("Could not refresh token");
        }
        const response = await resp.json();
        state.session = {
          provider: state.session.provider,
          accessToken: response.access_token,
          tokenType: response.token_type,
          refreshToken: response.refresh_token,
          expiresAt: Date.now() + response.expires_in * 1e3
        };
        if (providerParams.userInfoTokenName) {
          state.session.userInfo = response[providerParams.userInfoTokenName];
        }
      }
      async function fetchWithCredentials(request) {
        if (!state.session) {
          return generateResponse({ error: 3 }, 401);
        } else if (state.session.expiresAt < Date.now()) {
          try {
            await refreshToken();
          } catch {
            return generateResponse({ error: 3 }, 401);
          }
        }
        const updatedRequest = new Request(request, {
          headers: {
            ...request.headers,
            Authorization: `${state.session.tokenType} ${state.session.accessToken}`,
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
          if (!csrf || !checkCsrfToken(csrf)) {
            return event.respondWith(generateResponse({ error: 2 }, 400));
          }
        }
        if (event.request.headers.get("X-Use-Auth")) {
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
      function createSession(params, localState) {
        return getUserData();
      }
      async function getUserData() {
        var _a, _b, _c, _d;
        if (!state.session) {
          throw new Error("No session found");
        }
        const providerParams = (_b = (_a = state.config) == null ? void 0 : _a.providers) == null ? void 0 : _b[state.session.provider];
        if (state.session.userInfo) {
          const decoded = jwt_decode_esm_default(state.session.userInfo);
          return ((_c = providerParams == null ? void 0 : providerParams.userInfoParser) == null ? void 0 : _c.call(providerParams, decoded)) || decoded;
        } else if (providerParams == null ? void 0 : providerParams.userInfoUrl) {
          const resp = await fetch(providerParams.userInfoUrl, {
            headers: {
              Authorization: `${state.session.tokenType} ${state.session.accessToken}`
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
      function deleteSession() {
        state.session = void 0;
      }
      var operations = {
        getCsrfToken,
        createSession,
        getUserData,
        deleteSession
      };
      function messageListener(event) {
        if (event.data.type === "call") {
          if (event.data.fnName in operations) {
            const fn = operations[event.data.fnName];
            const result = fn(...event.data.options);
            event.ports[0].postMessage({ key: event.data.caller, result });
          }
        }
      }
      var config = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("config") || "{}"));
      function initAuthWorker2(providers) {
        state.config = {
          config,
          providers
        };
        const scope = globalThis;
        state.providers = providers;
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
        userInfoParser: (data) => ({
          id: data.sub,
          name: data.name,
          email: data.email,
          picture: data.picture
        })
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