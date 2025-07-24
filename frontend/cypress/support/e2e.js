beforeEach(() => {
  cy.intercept({ url: '**', middleware: true }, (req) => {
    // eslint-disable-next-line no-console
    console.log('[CYPRESS][request]', req.method, req.url, req.headers, req.body);
    req.on('response', (res) => {
      // eslint-disable-next-line no-console
      console.log('[CYPRESS][response]', res.statusCode, res.body);
    });
  });
}); 