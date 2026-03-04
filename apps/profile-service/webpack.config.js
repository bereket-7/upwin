const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node',

  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    libraryTarget: 'commonjs2'
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  /**
   * ✅ CRITICAL — Do NOT bundle Prisma runtime
   */
  externals: {
    '@prisma/client': 'commonjs @prisma/client',
    '@prisma/client/runtime/library': 'commonjs @prisma/client/runtime/library',
    '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
    pg: 'commonjs pg'
  },

  optimization: {
    minimize: false
  },

  plugins: [

    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',

      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',

      assets: ['./src/assets'],

      optimization: false,
      outputHashing: 'none',

      generatePackageJson: true,

      /**
       * ✅ MUST be true for Node Prisma stack trace safety
       */
      sourceMap: true
    }),

    /**
     * Prevent NestJS optional module bundling
     */
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/(microservices|websockets|platform-socket.io)$/
    }),

    /**
     * revent Prisma engine bundling
     */
    new webpack.IgnorePlugin({
      resourceRegExp: /@prisma\/(engines|runtime)/
    })
  ]
};