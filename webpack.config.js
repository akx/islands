module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /.co?$/,
        use: [
          {
            loader: 'eslint-loader',
          },
          {
            loader: require.resolve('./coco-loader'),
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
};
