/* eslint import/no-extraneous-dependencies: 0 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

const project = (process.env.project || 'nisra').trim();

module.exports = merge(common, {
  watch: true,
  devtool: 'cheap-module-eval-source-map',
  watchOptions: {
    ignored: /node_modules/
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist', project),
    compress: true,
    port: 9000
  }
});
