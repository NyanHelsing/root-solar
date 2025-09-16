import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { ApiRouter } from "./router";

export const client = createTRPCClient<ApiRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api",
      async headers() {
        return {
          authorization: "",
        };
      },
    }),
  ],
});
