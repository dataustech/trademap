const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    },
    devServer: {
        contentBase: path.join(__dirname, "dist/nisra"),
        compress: true,
        port: 9000
    }
});