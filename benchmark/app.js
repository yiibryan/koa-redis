var session = require('koa-session-minimal');
var redisStore = require('koa-redis');
var koa = require('koa');

var app = koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  store: redisStore({
    // Options specified here
  })
}));

app.use(function *() {
  switch (this.path) {
    case '/get':
      get.call(this);
      break;
    case '/remove':
      remove.call(this);
      break;
    case '/regenerate':
      yield regenerate.call(this);
      break;
  }
});

function get() {
  var session = this.session;
  session.count = session.count || 0;
  session.count++;
  this.body = session.count;
}

function remove() {
  this.session = null;
  this.body = 0;
}

function *regenerate() {
  get.call(this);
  yield this.regenerateSession();
  get.call(this);
}

app.listen(8080);
