koa-redis
=========

[![build status][travis-image]][travis-url]
[![node version][node-image]][node-url]
[![license][license-image]][license-url]

[travis-image]: https://img.shields.io/travis/koajs/koa-redis.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/koa-redis
[node-image]: https://img.shields.io/node/v/koa-redis.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[license-image]: https://img.shields.io/npm/l/koa-redis.svg?style=flat-square
[license-url]: https://github.com/yiibryan/koa-redis/blob/master/LICENSE

Copy from [koa-redis](https://github.com/koajs/koa-redis).  
Redis storage for koa session middleware/cache.  
**Support redis cluster.**

## Usage

`koa-redis` works with [koa-session-minimal](https://github.com/longztian/koa-session-minimal) (a generic session middleware for koa) or [koa-session](https://github.com/koajs/session).  
`koa-redis` use [ioredis](https://github.com/luin/ioredis) to connect redis. so the config will support `ioredis` options.

### Example

```js
var session = require('koa-session-minimal');
var redisStore = require('@yir/koa-redis');
var koa = require('koa');

var app = koa();
app.use(session({
  key:'USER_SID',
  store:redisStore({config: 'redis://:123456@127.0.0.1:6379/1'})
  /*store:redisStore({config: {
      port: 6379,          // Redis port
      host: '127.0.0.1',   // Redis host
      family: 4,           // 4 (IPv4) or 6 (IPv6)
      password: '123456',
      db: 1
    }})*/
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
```
For more examples, please see the [examples folder of `koa-generic-session`](https://github.com/koajs/generic-session/tree/master/example).

### Options

 - *all [`ioredis`](https://github.com/luin/ioredis-properties) options* - Useful things include `url`, `host`, `port`, and `path` to the server. Defaults to `127.0.0.1:6379`
 - `db` (number) - will run `client.select(db)` after connection
 - `client` (object) - supply your own client, all other options are ignored unless `duplicate` is also supplied
 - `duplicate` (boolean) - When true, it will run `client.duplicate(options)` on the supplied `client` and use all other options supplied. This is useful if you want to select a different DB for sessions but also want to base from the same client object.
 - `serialize` - Used to serialize the data that is saved into the store.
 - `unserialize` - Used to unserialize the data that is fetched from the store.

### Events
See the [`ioredis` docs](https://github.com/luin/ioredis) for more info.

### API
These are some the functions that `koa-session-minimal` / `koa-session` uses that you can use manually. You will need to initialize differently than the example above:
```js
var session = require('koa-session-minimal');
var redisStore = require('@yir/koa-redis')({
  // Options specified here
});
var app = require('koa')();

app.keys = ['keys', 'keykeys'];
app.use(session({
  key:'keys',
  store: redisStore
}));
```

#### module([options])
Initialize the Redis connection with the optionally provided options (see above). *The variable `session` below references this*.
```js
var session = require('@yir/koa-redis')({
  // Options specified here
});
session.client.set(sid, sess, ttl);
```
#### session.get(sid)
Generator that gets a session by ID. Returns parsed JSON is exists, `null` if it does not exist, and nothing upon error.

#### session.set(sid, sess, ttl)
Generator that sets a JSON session by ID with an optional time-to-live (ttl) in milliseconds. Yields `node_redis`'s `client.set()` or `client.setex()`.

#### session.destroy(sid)
Generator that destroys a session (removes it from Redis) by ID. Tields `node_redis`'s `client.del()`.

#### session.quit()
Generator that stops a Redis session after everything in the queue has completed. Yields `node_redis`'s `client.quit()`.

#### session.end()
Alias to `session.quit()`. It is not safe to use the real end function, as it cuts off the queue.

#### session.connected
Boolean giving the connection status updated using `client.connected` after any of the events above is fired.

#### session.client
Direct access to the `ioredis` client object.

## Testing
1. Start a Redis server on `localhost:6379`. You can use [`redis-windows`](https://github.com/ServiceStack/redis-windows) if you are on Windows or just want a quick VM-based server.
2. Clone the repository and run `npm i` in it (Windows should work fine).
3. If you want to see debug output, turn on the prompt's `DEBUG` flag.
4. Run `npm test` to run the tests and generate coverage. To run the tests without generating coverage, run `npm run-script test-only`.

## Authors
See the [contributing tab](https://github.com/koajs/koa-redis/graphs/contributors)

## Licences
(The MIT License)

Copyright (c) 2015 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
