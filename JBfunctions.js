// This file contains all JokeBot Functions
require('dotenv').config();
const crypto = require('crypto');

class JBApp {
  constructor(id,key) {
    this.app_id = id;
    this.api_key = key;
    this.api_requests = 0;
  }
};

class JBJoke {
  constructor(id,cat,joke) {
      this.Jid = id;
      this.Category = cat;
      this.Joke = joke;
      this.Used = 0;
  }
};

class JBToken {
  constructor(appid,token) {
      this.app_id = appid;
      this.access_token = token;
      this.expires = new Date().getTime() + 600;
      this.token_type = "Standard";
  }
};

function JB() {
  console.log("JB Class initialised");
}

JB.prototype.newAppObject = function() {
  const myobj = new JBApp(generateAppId(),generateAPIKey());
  return(myobj);
}


// check all values are valid and sanitise before inserting into database
JB.prototype.validateJoke = function(jobj) {
  return new JBJoke(jobj.Jid,jobj.Category,jobj.Joke);
}

// check all values are valid before updating existing joke
JB.prototype.verifyquestion = function(jobj) {

    return null;
}

// Create a new token
JB.prototype.createToken = function(appid) {
  return new JBToken(appid,generateToken());
}

// generates a random number 12 digits long
function generateAppId() {
	var value = Math.floor(Math.random() * 1000000000000) + 1;
	return(value);
}

// generates a random base64 string
function generateAPIKey() {
  var value = generateAppId();
  var time = new Date().getTime();
  var random = value.toString() + time.toString();
  console.log("Value: "+value+" Random: "+random);
  let buf = Buffer.from(random);
	return(buf.toString('base64'));
}

function generateToken() {
  var length = 16,
  charset = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789",
  retval = "";
  for(var i = 0, n = charset.length; i < length; ++i) {
      retval += charset.charAt(Math.random() * n);
  }
  const token = crypto.createHash('sha256').update(retval).digest('hex');

  return token;
}

module.exports = JB;
