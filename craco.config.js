module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallback for node modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "path": require.resolve("path-browserify"),
      };

      // Remove the invalid ignoreWarnings property
      if (webpackConfig.ignoreWarnings) {
        delete webpackConfig.ignoreWarnings;
      }

      return webpackConfig;
    }
  }
};