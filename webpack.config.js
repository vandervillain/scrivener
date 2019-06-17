var path = require('path');

module.exports = {
    target: 'electron-main',
    devtool: 'inline-source-map',
    //context: path.resolve(__dirname),
    entry: {
        main: './src/onLoad'
    },
    module: {
        rules: [
            // {
            //   test: /\.css$/,
            //   use: ['style-loader', 'css-loader']//, 'less-loader']
            // },
            // {
            //   test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
            //   use: 'url-loader'
            // },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css'],
        modules: [path.resolve(__dirname, 'node_modules')]
    },
    output: {
        path: __dirname,
        filename: 'main.js'
    },
    devtool: 'source-map'
};