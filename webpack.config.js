const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require('webpack');

module.exports = {
    entry: [
        path.join(__dirname, 'src/MVP/index.ts')
    ],

    output: {
        path: path.join(__dirname, 'distMVP'),
        filename: 'index.js'
    },
    plugins: [
        new ExtractTextPlugin('./style.css'),
        new webpack.ProvidePlugin({
            XLSX: 'xlsx'
        }),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-transform-runtime']
                    }
                }
            },
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, 'src'),
                use: 'ts-loader'
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader',
                }),
            },
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    devtool: "source-map"
};