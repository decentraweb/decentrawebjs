const path = require('path');
const webpack = require('webpack');
const {version} = require('./package.json');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    'decentraweb-core': './src/index.ts'
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new BundleAnalyzerPlugin(),
    new webpack.ProvidePlugin({
      Buffer: ['buffer/', 'Buffer']
    })
  ],
  externals: {
    ethers: 'ethers',
    crypto: 'crypto'
  },
  resolve: {
    alias: {
      // To avoid blotting up the `bn.js` library all over the packages
      // use single library instance.
      'buffer': path.resolve(__dirname, '../../node_modules/buffer')
    },
    extensions: ['.ts', '.js', '.json'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.cjs': ['.cts', '.cjs'],
      '.mjs': ['.mts', '.mjs'],
    },
    fallback: {
      buffer: require.resolve('buffer/')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|mjs|cjs|ts|mts|cts)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript',
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'entry',
                  corejs: '3.25',
                  targets: ['>0.2%', 'not dead', 'not op_mini all']
                }
              ]
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', {version: 'legacy'}],
              ['@babel/plugin-syntax-import-attributes',{ deprecatedAssertSyntax: true }],
            ]
          }
        }
      }
    ]
  },
  output: {
    filename: `[name]-${version}.min.js`,
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'Decentraweb',
      type: 'umd'
    }
  }
};
