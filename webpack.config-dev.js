const path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build/dev'), 
  },
  module: {
    rules: [
      {
        test: /\.js$/, 
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: false
  },
  mode: 'production',
};