const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:55555',
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
      onProxyRes: function (proxyRes, req, res) {
        // Ensure cookies are properly forwarded
        if (proxyRes.headers['set-cookie']) {
          proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie =>
            cookie.replace(/Domain=localhost:55555/gi, 'Domain=localhost')
          );
        }
      }
    })
  );
}; 