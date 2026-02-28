const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: [
    // Externalize Prisma client so it's not bundled by webpack
    function ({ request }, callback) {
      if (request && request.includes('generated/prisma')) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ],
  resolve: {
    alias: {
      '@org/shared': join(__dirname, '../../libs/shared/src/index.ts'),
    },
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
      sourceMap: true,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^pg-native$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/microservices$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/websockets$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/platform-socket.io$/,
    }),
  ],
};
