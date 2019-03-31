'use strict';

const debug = require('debug')('koa-redis');
const Redis = require('ioredis');
/**
 * Initialize redis session middleware with `options`, isCluster (see the README for more info):
 * @param options
 * @param isCluster
 * @returns {RedisStore|*}
 * @constructor
 */
const RedisStore = function (options, isCluster = false) {
  if (!(this instanceof RedisStore)) {
    return new RedisStore(options, isCluster);
  }
  options = Object.assign({
    client: null,
    config: {
      port: 6379,          // Redis port
      host: '127.0.0.1',   // Redis host
      family: 4,           // 4 (IPv4) or 6 (IPv6)
      password: '',
      db: 0
    },
    prefix:"",
    serialize: null,
    unSerialize: null,
    nodes: null,
    redisOptions: null
  }, options || {});
  this.prefix = options.prefix || '';
  this.connected = false;
  if (!options.client) {
    debug('Init redis new client');

    // Apply ioredis, Add has redis cluster condition：
    if (isCluster && options.nodes) {
      this.client = new Redis.Cluster(options.nodes, {redisOptions: options.redisOptions});
    } else {
      this.client = new Redis(options.config);
    }
  }else{
    debug('Using provided client');
    this.client = options.client;
  }
  this.client.on('error', (_error) => {
    debug(_error);
  });

  this.client.on('end', () => {
    debug('Redis ended.');
  });

  this.client.on('connect', () => {
    debug('Redis connected.');
    this.connected = this.client.connected;
  });

  this.serialize = (typeof options.serialize === 'function' && options.serialize) || JSON.stringify;
  this.unSerialize = (typeof options.unSerialize === 'function' && options.unSerialize) || JSON.parse;
};

RedisStore.prototype.get = async function (key) {
  try {
    key = this.prefix + key;
    const data = await this.client.get(key);
    debug('get session: %s', data || 'none');
    if (!data) {
      return null;
    }
    return this.unSerialize(data.toString());
  }catch (e) {
    // ignore err
    debug('parse session error: %s', e.message);
  }
};

RedisStore.prototype.set = async function (key, sess, ttl) {
  if (typeof ttl === 'number') {
    ttl = Math.ceil(ttl / 1000);
  }
  key = this.prefix + key;
  sess = this.serialize(sess);
  try{
    if (ttl) {
      debug('SETEX %s %s %s', key, ttl, sess);
      await this.client.setex(key, ttl, sess);
    } else {
      debug('SET %s %s', key, sess);
      await this.client.set(key, sess);
    }
    debug('SET %s complete', key);
  }catch(e){
    debug('SET error: %s', e.message);
  }
};

RedisStore.prototype.destroy = async function (key) {
  try{
    key = this.prefix + key;
    debug('DEL %s', key);
    await this.client.del(key);
    debug('DEL %s complete', key);
  }catch(e){
    debug('SET error: %s', e.message);
  }
};

RedisStore.prototype.quit = async function () {
  try{
    debug('quitting redis client');
    await this.client.quit();
  }catch(e){
    debug('SET error: %s', e.message);
  }
};

RedisStore.prototype.end = async function(){
  await this.quit();
  debug('End redis client');
};

module.exports = RedisStore;
