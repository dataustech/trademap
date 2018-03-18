/* eslint import/no-extraneous-dependencies: 0 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  watch: true,
  devtool: 'cheap-module-eval-source-map',
  watchOptions: {
    ignored: /node_modules/
  },
  devServer: {
    compress: true,
    port: 9000
  }
});
