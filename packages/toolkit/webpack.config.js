const path = require('path');
const webpack = require('webpack');
const {version} = require('./package.json');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    "decentraweb-toolkit": './src/index.browser.ts'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new BundleAnalyzerPlugin(),
    new webpack.ProvidePlugin({
      Buffer: ['buffer/', 'Buffer'],
    }),
  ],
  externals: {
    ethers: 'ethers',
  },
  resolve: {
    alias: {
      // To avoid blotting up the `bn.js` library all over the packages
      // use single library instance.
      "bn.js": path.resolve(__dirname, '../../node_modules/bn.js')
    },
    extensions: ['.ts', '.js', '.json'],
    fallback: {
      buffer: require.resolve('buffer/'),
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
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
            plugins: []
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
