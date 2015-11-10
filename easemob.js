var request = require('request');
var async = require('async');
var redis = require('redis');
var _ = require('underscore');


var tseuper = function(opts, callback) {
  request(opts, function(err, res, body) {
    if (err) { return callback(err);}
    opts.headers = _.extend(opts.headers || {}, {'Content-Type': 'application/json'});

    if (!res || !body || res.statusCode !== 200) {
      callback('wrong status code');
    }

    return callback(null, body);
  });
};

function Em (opts) {
  this.apiUrl = 'https://a1.easemob.com/';
  this.appKey = opts.appKey;
  this.clientSecret = opts.clientSecret;
  this.clientId = opts.clientId;
  this.orgName = opts.orgName;
  this.appName = opts.appName;
  this.url = this.apiUrl + this.orgName + '/' + this.appName;
  if (opts.redis) {
    this.redisConf = _.extend(opts.redis || {}, {host: "localhost", port: 6379});
    this.emRedis = redis.createClient(this.redisConf.port, this.redisConf.host);
  }
  else {
    this.loadToken=opts.loadToken;
    this.saveToken=opts.saveToken;
  }
}

Em.prototype.getToken = function(callback) {
  var key = 'easemob:app:token';
  var ctx = {};
  var self = this;

  async.waterfall([
    function(next) {
      if (self.emRedis) self.emRedis.get(key, next);
      else self.loadToken(next);
    },
    function(token, next) {
      if (token) return callback(null, token);
      var opts = {
        url: self.url + '/token',
        json: {
          grant_type: 'client_credentials',
          client_id: self.clientId,
          client_secret: self.clientSecret
        },
        method: 'POST'
      };
      tseuper(opts, function(err, body) {
        if (err) return callback(err);
        var token = body.access_token;
        var expiredIn = body.expires_in;
        ctx.token = token;

        if (!token || !expiredIn) return next('get token err');
        if (self.emRedis) self.emRedis.multi().set(key, token).expire(key, expiredIn - 600).exec(next);
        else self.saveToken(token, next);
      });
    }
  ], function(err) {
    callback(err, ctx.token);
  });
};

Em.prototype.createUser = function(user, callback) {
  var url = this.url + '/' + 'users';

  var opts = {
    url: url,
    json: {
      username: user.username,
      password: user.password,
      nickname: user.nickname
    },
    method: 'POST'
  };

  var self = this;

  async.waterfall([
    function(next) {
      self.getToken(next);
    },
    function(token, next) {
      opts.headers = {Authorization: 'Bearer ' + token};
      tseuper(opts, next);
    }
  ], function(err, body) {
    var emUser = body && body.entities && body.entities[0] || null;
    if (err || !emUser || !emUser.uuid) return callback(err || 'create chat user err');

    emUser.password = user.password;
    return callback(null, emUser);
  });
};

module.exports = Em;
