'use strict';

const EventEmitter = require('events').EventEmitter;
const Redis = require('ioredis');

class RedisStore extends EventEmitter {
  constructor(options, isCluster = false) {
    super();

    if (!this instanceof RedisStore) {
      return new RedisStore(options);
    }

    options = Object.assign({
      redis: null,
      config: {
        port: 6379,          // Redis port
        host: '127.0.0.1',   // Redis host
        family: 4,           // 4 (IPv4) or 6 (IPv6)
        password: 'auth',
        db: 0
      },
      serialize: null,
      unSerialize: null,
      nodes: null,
      redisOptions: null
    }, options || {});

    let redis = null;
    if (!options.redis) {
      debug('Init redis new client');

      // Apply ioredis, Add has redis cluster condition：
      if (isCluster && options.nodes) {
        redis = new Redis.Cluster(options.nodes, {redisOptions: options.redisOptions});
      } else {
        redis = new Redis(options.config);
      }
    }
    this.redis = redis;
    this.serialize = (typeof options.serialize === 'function' && options.serialize) || JSON.stringify;
    this.unSerialize = (typeof options.unSerialize === 'function' && options.unSerialize) || JSON.parse;
  }

  async get(sid) {
    try {
      const data = await this.client.get(sid);
      debug('get session: %s', data || 'none');
      if (!data) {
        return null;
      }
      return this.unserialize(data.toString());
    }catch (e) {
      // ignore err
      debug('parse session error: %s', e.message);
    }
  }

  async set(sid, sess, ttl) {
    if (typeof ttl === 'number') {
      ttl = Math.ceil(ttl / 1000);
    }
    sess = this.serialize(sess);
    try{
      if (ttl) {
        debug('SETEX %s %s %s', sid, ttl, sess);
        await this.client.setex(sid, ttl, sess);
      } else {
        debug('SET %s %s', sid, sess);
        await this.client.set(sid, sess);
      }
      debug('SET %s complete', sid);
    }catch(e){
      debug('SET error: %s', e.message);
    }
  }

  async destroy(sid) {
    try{
      debug('DEL %s', sid);
      await this.client.del(sid);
      debug('DEL %s complete', sid);
    }catch(e){
      debug('SET error: %s', e.message);
    }
  }

  async quit(){
    try{
      debug('quitting redis client');
      await this.client.quit();
    }catch(e){
      debug('SET error: %s', e.message);
    }
  }

  async end(){
    await this.quit();
    debug('End redis client');
  }

}

module.exports = RedisStore;
