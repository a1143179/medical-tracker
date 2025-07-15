module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        paths.appBuild = '../backend/wwwroot';
        webpackConfig.output.path = require('path').resolve(__dirname, '../backend/wwwroot');
      }
      return webpackConfig;
    },
  },
}; 