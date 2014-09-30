var request = require('supertest');
var app = require('../server/app');

describe('__gtg is good to go', function() {
  it('GET /stories responds with correct JSON array', function(done) {
      request(app)
        .get('/__g2g')
        .expect(200, done);
  });
});
