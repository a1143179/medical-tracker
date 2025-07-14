const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
    })
  );
}; 