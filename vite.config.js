import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

let config = defineConfig({
  build: {
    outDir: "dist_examples"
  }
});

if (!process.env.BUILD_EXAMPLES) {
  config = defineConfig({
    build: {
      lib: {
        entry: resolve(__dirname, 'lib/main.ts'),
        name: 'littleslope',
      },
    },
    plugins: [dts()],
  });
}

export default config;