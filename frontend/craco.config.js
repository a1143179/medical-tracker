module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Removed custom output path logic for Docker compatibility
      return webpackConfig;
    },
  },
}; 