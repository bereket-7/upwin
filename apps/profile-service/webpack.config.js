const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'node',
  
  externals: {
    '@prisma/client': 'commonjs @prisma/client',
    'prisma': 'commonjs prisma',
  },

  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },

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