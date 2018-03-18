/* eslint import/no-extraneous-dependencies: 0 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  devServer: {
    contentBase: path.join(__dirname, 'dist', 'comtrade'),
    proxy: {
      '/api': {
        target: 'https://comtrade.un.org',
        secure: false,
        changeOrigin: true
      }
    }
  }
});
