const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node',

  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    libraryTarget: 'commonjs2',
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  /**
   * Prevent Prisma runtime bundling
   */
  externals: {
    '@prisma/client': 'commonjs @prisma/client',
    '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
    'pg': 'commonjs pg',
    '@prisma/client/runtime/library':
      'commonjs @prisma/client/runtime/library'
  },

  optimization: {
    minimize: false,
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

      sourceMap: false,
    }),

    /**
     * Prevent NestJS optional module bundling issues
     */
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/(microservices|websockets|platform-socket.io)$/,
    }),

    /**
     * Prevent Prisma optional binary engine bundling
     */
    new webpack.IgnorePlugin({
      resourceRegExp: /(^@prisma\/engines$|^prisma\/lib\/engines$)/,
    }),
  ],
};