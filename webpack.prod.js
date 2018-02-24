const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const common = require('./webpack.common.js');
const WebpackClearConsole = require("webpack-clear-console").WebpackClearConsole;

module.exports = merge(common, {
    plugins: [
        new UglifyJSPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new WebpackClearConsole(),
        new ZipPlugin({
            path: path.resolve(__dirname, 'dist'),
            filename: project+'.zip'
        })
    ]
});