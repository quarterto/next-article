var request = require('supertest');
var app = require('../server/app');

describe('__gtg is good to go', function() {
  it('GET /__get responds with a 200 response', function(done) {
      request(app)
        .get('/__g2g')
        .expect(200, done);
  });
});
