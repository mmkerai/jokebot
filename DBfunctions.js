// This file contains all Mongo DB Functions
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const Jokes = "JBJokes";
const Apps = "JBApps";
const DBNAME = process.env.MONGODBNAME;
const URI = process.env.MONGOURI;
var CollApps = 0;
var CollJokes = 0;

function DB() {
  const client = new MongoClient(URI,{useNewUrlParser: true,useUnifiedTopology: true});
  client.connect(err => {
    CollApps = client.db(DBNAME).collection(Apps);
    CollJokes = client.db(DBNAME).collection(Jokes);
  });
  console.log("DB Class initialised");
}

DB.prototype.createApp = function(appobj,callback) {
  CollApps.insertOne(appobj,function(err, res) {
    if (err) throw err;
//    console.log("Inserted into collection Apps:" +res);
    callback(appobj);
  });
}

DB.prototype.viewApps = function(callback) {
  CollApps.find({ }).toArray(function(err,result) {
    if (err) throw err;
    callback(result);
  });
}

// Insert a new joke (document) in the jokes collection
DB.prototype.insertJoke = function(jobj) {
  CollJokes.insertOne(jobj, function(err, res) {
    if (err) throw err;
//    console.log("1 joke inserted:" +res.insertedId);
  });
}

// update a joke (document) with same jid
DB.prototype.updateJoke = function(jobj,callback) {
  CollJokes.updateOne(
    {jid: Number(jobj.jid)}, 
    {$set: {
        "category" : jobj.category,
        "joke" : jobj.joke,
        "used" : jobj.used
      }
    },
    function(err, res) {
      if (err) throw err;
      console.log("joke updated:" +jobj.jid);
      callback(jobj);
  });
}

// Gets total number of questions
DB.prototype.getNumJokes = function(method) {
  CollJokes.countDocuments({},function(err,result) {
		if (err) throw err;
    method(result);
  });
}

// Clear the Jokes collection
// Used to load fresh jokes - at start only
DB.prototype.clearAllJokes = function() {
  CollJokes.deleteMany({},function(err,result) {
		if (err) throw err;
    console.log("Collection Jokes Deleted OK");
    });
}

DB.prototype.getCategories = function(callback) {
//  console.log("Getting categories");
  CollJokes.distinct("Category", function(err,result) {
		if (err) console.log("No categories"); 
    callback(result);
  });
}

// Tries to get a random joke. First get total number of jokes
// then it gets all jokes in an array and indexes a random one
// Must be a better way of doing this
DB.prototype.getRandomJoke = function(callback) {
  //  console.log("Getting a random joke);
  CollJokes.countDocuments({},function(err,result) {
		if (err) throw err;
    var r = Math.floor(Math.random() * result);
    CollJokes.find({}).toArray(function(err,jokes) {
      if (err) throw err;
      callback(jokes[r]);
    });
  });
}
  
DB.prototype.getJokesByCat = function(cat,callback) {
//  console.log("Getting jokes of cat "+cat);
    CollJokes.find({Category:cat}).toArray(function(err,result) {
      if (err) console.log("No jokes of cat: "+cat);
    callback(result);
  });
}

DB.prototype.getJokeById = function(id,callback) {
  console.log("Getting joke id "+id);
  CollJokes.findOne({Jid:Number(id)},function(err,result) {
    if (err) throw err;
    if(!result) console.log("No joke with id: "+id);
//     console.log("Joke "+id+" details: "+JSON.stringify(result));
    callback(result);
  });
}

DB.prototype.authenticate = function(appid,apikey,callback) {
//  console.log("Auth request for app id "+appid);
  CollApps.findOne({app_id:Number(appid),api_key:apikey},function(err,result) {
    if (err) console.log("No app with id: "+appid);
    console.log("auth details: "+JSON.stringify(result));
    callback(result);
  });
}

DB.prototype.updateAppUsage = function(appid) {
  CollApps.updateOne(
    {app_id:Number(appid)},{$inc: {api_requests : 1}},function(err, res) {
      if (err) throw err;
//      console.log("Stats updated:" +res.result.nModified);
  });
}

DB.prototype.updateJokeUsage = function(joke) {
  CollJokes.updateOne(
      {_id:joke._id},{$inc: {Used : 1}},function(err, res) {
        if (err) throw err;
        console.log("Stats updated:" +res.result.nModified);
    });
  }
  
module.exports = DB;
