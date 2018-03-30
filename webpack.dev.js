/* eslint import/no-extraneous-dependencies: 0 */
const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const project = (process.env.PROJECT || 'nisra').trim();

const projectConfigs = {
  nisra: {
    // TODO remove this later
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
  },
  comtrade: {
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
  }
};

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
}, projectConfigs[project]);
