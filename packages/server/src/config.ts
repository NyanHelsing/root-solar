export const ENV = process.env.ENV ?? process.env.NODE_ENV ?? "production";
export const IS_DEVELOPMENT = ENV === "development";
export const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
export const HOST = process.env.HOST ?? "0.0.0.0";
