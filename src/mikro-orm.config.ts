import { defineConfig } from "@mikro-orm/sqlite";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

import * as entities from "./api/persistence/entities/index.ts";

export default defineConfig({
  dbName: "app.sqlite",
  entities: Object.values(entities),
  metadataProvider: TsMorphMetadataProvider,
  debug: true,
});
