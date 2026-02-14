import { defineConfig } from '@prisma/client/generator-build';

export default defineConfig({
  generator: {
    provider: 'prisma-client-js',
    output: './src/generated/client',
  },
});
