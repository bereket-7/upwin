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

  externals: {
    '@prisma/client': 'commonjs @prisma/client',
    '@prisma/client/runtime/library': 'commonjs @prisma/client/runtime/library',
    '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
    pg: 'commonjs pg'
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

      webpackConfig: {
        externals: {
          '@prisma/client': 'commonjs @prisma/client'
        }
      }
    }),

    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/(microservices|websockets|platform-socket.io)$/
    }),

    new webpack.IgnorePlugin({
      resourceRegExp: /(^@prisma\/engines$|^prisma\/lib\/engines$)/
    })
  ],
};