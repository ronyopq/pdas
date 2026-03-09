import worker from "../../src/server/index";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SESSIONS?: KVNamespace;
  APP_NAME?: string;
  APP_TIMEZONE?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  return worker.fetch(context.request, context.env);
};
