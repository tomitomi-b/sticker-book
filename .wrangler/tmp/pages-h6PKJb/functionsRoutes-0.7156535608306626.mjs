import { onRequest as __api_claim_js_onRequest } from "/Users/tomitanaoki/Library/Mobile Documents/com~apple~CloudDocs/アイデア/商売/電子版シール帳/sticker-book/functions/api/claim.js"
import { onRequest as __api_collection_js_onRequest } from "/Users/tomitanaoki/Library/Mobile Documents/com~apple~CloudDocs/アイデア/商売/電子版シール帳/sticker-book/functions/api/collection.js"
import { onRequest as __api_exchange_js_onRequest } from "/Users/tomitanaoki/Library/Mobile Documents/com~apple~CloudDocs/アイデア/商売/電子版シール帳/sticker-book/functions/api/exchange.js"
import { onRequest as __api_me_js_onRequest } from "/Users/tomitanaoki/Library/Mobile Documents/com~apple~CloudDocs/アイデア/商売/電子版シール帳/sticker-book/functions/api/me.js"
import { onRequest as __api_spots_js_onRequest } from "/Users/tomitanaoki/Library/Mobile Documents/com~apple~CloudDocs/アイデア/商売/電子版シール帳/sticker-book/functions/api/spots.js"

export const routes = [
    {
      routePath: "/api/claim",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_claim_js_onRequest],
    },
  {
      routePath: "/api/collection",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_collection_js_onRequest],
    },
  {
      routePath: "/api/exchange",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_exchange_js_onRequest],
    },
  {
      routePath: "/api/me",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_me_js_onRequest],
    },
  {
      routePath: "/api/spots",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_spots_js_onRequest],
    },
  ]