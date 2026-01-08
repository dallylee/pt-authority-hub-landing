import { onRequest as __api_reviews_ts_onRequest } from "C:\\PROJECTS\\pt-authority-hub-landing\\functions\\api\\reviews.ts"
import { onRequest as __api_spots_ts_onRequest } from "C:\\PROJECTS\\pt-authority-hub-landing\\functions\\api\\spots.ts"

export const routes = [
    {
      routePath: "/api/reviews",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_reviews_ts_onRequest],
    },
  {
      routePath: "/api/spots",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_spots_ts_onRequest],
    },
  ]