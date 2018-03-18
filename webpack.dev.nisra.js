/* eslint import/no-extraneous-dependencies: 0 */
const merge = require('webpack-merge');
const dev = require('./webpack.dev.js');
const path = require('path');

module.exports = merge(dev, {
  devServer: {
    contentBase: path.join(__dirname, 'dist', 'nisra'),
    proxy: {
      '/api': {
        target: 'https://comtrade.un.org',
        secure: false,
        changeOrigin: true
      }
    }
  }
});
