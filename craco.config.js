const path = require('path');

module.exports = {
  webpack: {
    alias: {},
    plugins: [],
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify"),
        crypto: require.resolve("crypto-browserify"),
        os: require.resolve("os-browserify"),
        constants: require.resolve("constants-browserify"),
        fs: false
      };

      return webpackConfig;
    },
  },
};
