Nodejs Client for [环信/Easemob](http://www.easemob.com)

## How To Use
 * npm install easemob
 * in your code
  ```js
    var easemob = require('easemob');


    Em = new easemob({
      appKey: "appKey"
      clientSecret: "clientSecret",
      clientId: "clientId",
      orgName: "orgName",
      appName: "appName",
      loadToken:function(callback) {callback(null, token); },
      saveToken:function(token, callback) {callback(null);}
    });

    Em.createUser({
      username: "somename",
      password: "password",
      nickname: "nickName"
    }, function(err, result) {
      console.log('err <<<', err);
      console.log('result <<<', result);
    })
  ```

##TODO

##License

MIT
