const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
var ZipPlugin = require('zip-webpack-plugin');

const project = process.env.project.trim() || "nisra";

module.exports = {
  entry: './src/'+project+'/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/'+project)
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: true,
                sourceMap: true
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                plugins: function () {
                  return [
                    require('precss'),
                    require('autoprefixer')
                  ];
                }
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ]
        })
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new ZipPlugin({
      path: path.resolve(__dirname, 'dist'),
      filename: project+'.zip'
    })
  ]
};