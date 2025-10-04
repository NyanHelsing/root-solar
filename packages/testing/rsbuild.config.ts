import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [pluginReact(), pluginSass()],
    source: {
        entry: {
            harness: "./packages/testing/src/harness/index.ts"
        }
    },
    output: {
        distPath: {
            root: path.join(dirname, "../../dist/testing")
        },
        assetPrefix: "./"
    },
    server: {
        strictPort: true
    }
});
