const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'media-kit-builder.js',
      libraryTarget: 'umd',
      library: 'MediaKitBuilder',
      libraryExport: 'default'
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'media-kit-builder.css'
      })
    ],
    resolve: {
      extensions: ['.js', '.css'],
      alias: {
        '@core': path.resolve(__dirname, 'src/core'),
        '@ui': path.resolve(__dirname, 'src/ui'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@adapters': path.resolve(__dirname, 'src/adapters'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/utils')
      }
    }
  };
};
