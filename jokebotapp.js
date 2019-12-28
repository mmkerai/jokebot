/* 
* This is the main app to run for Jokebot API
 */
// Version 1.0
var http = require('http');
var bodyParser = require('body-parser');
var app = require('express')();
var	server = http.createServer(app);
var	io = require('socket.io')(server);
var fs = require('fs');
const dbf = require('./DBfunctions.js');
const jbf = require('./JBfunctions.js');
var dbt = new dbf();
var jbt = new jbf();
var JB = new Object();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


//********** set the port to use
const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("Dir path: "+__dirname);
//*****Globals *************
const SUPERADMIN = "thecodecentre@gmail.com";
var AUTHUSERS = new Object(); // keep list of authenticated users by their socket ids
var ActiveTokens = new Object(); // keep list of active tokens by expiry time
const QFile = "testjokes.json";
//const QFile = "jokes.json";

// URL endpoint for authentication
app.post('/apiv1/authenticate', function(req, res) {
  var appid = req.body.app_id;
  var apikey = req.body.api_key;
  console.log("app id = "+appid+", api key = "+apikey);
  jbauthenticate(appid,apikey,function(token) {
    if(token) {  // credentials correct 
      res.send(JSON.stringify(token));
    }
    else
      res.status(401).send("Authentication failed");
  });
}); 

// URL endpoint for getting jokes
app.get('/apiv1/joke', function(req, res) {
  const cat = req.query.category;
  const jid = req.query.joke_id;
  const token = req.query.access_token;
  if(token) { // make sure token in GET params
    // Validate the token i.e.
    // make sure it is in the active list and hasn't expired
    if(ActiveTokens[token]) {
      dbt.updateAppUsage(ActiveTokens[token].app_id);  // update usage stats in DB
      if(jid) { // if a joke ID is specified it overrides the category field
        dbt.getJokeById(jid,function(thejoke) {
          if(thejoke) {
            res.send(JSON.stringify(thejoke));
            dbt.updateJokeUsage(thejoke);   // update usage stats for this joke
          }
          else
            res.send('{\"error\": \"Joke ID not found\"}');
        });
      }
      else if(cat) { // category is specified
        dbt.getRandomJokeByCat(cat,function(thejoke) {
          if(thejoke) {
            res.send(JSON.stringify(thejoke));
            dbt.updateJokeUsage(thejoke);   // update usage stats for this joke
          }
          else
            res.send('{\"error\": \"Joke not found\"}');
        });
      }
      else { // nothing specified so get a random joke
        dbt.getRandomJoke(function(thejoke) {
          if(thejoke) {
            res.send(JSON.stringify(thejoke));
            dbt.updateJokeUsage(thejoke);   // update usage stats for this joke
          }
          else
            res.send('{\"error\": \"Joke not found\"}');
        });
      }
    }
    else {
      res.send('{\"error\": \"Access token not valid\"}');
    }
  }
  else {
    res.send('{\"error\": \"Access token missing\"}');
  }
}); 

app.get('/*.js', function(req, res){
  res.sendFile(__dirname + req.path);
}); 
app.get('/*.css', function(req, res){
  res.sendFile(__dirname + req.path);
}); 
app.get('/jsadmin.html', function(req, res){
    res.sendFile(__dirname + req.path);
});
app.get('/jbutils.html', function(req, res){
  res.sendFile(__dirname + req.path);
});
/*
process.on('uncaughtException', function (err) {
  console.log('Exception: ' + err);
});
*/
console.log("Server started on port "+PORT);
// Set up socket actions and responses
io.on('connection',function(socket) {
//  console.log("Socket id: "+socket.id);
  socket.on('disconnect',function () {
    removeSocket(socket.id,"disconnect");
  });

  socket.on('end',function() {
    removeSocket(socket.id,"end");
  });

  socket.on('connect_timeout', function() {
    removeSocket(socket.id,"timeout");
  });

  // This is for proper login
  socket.on('SignInSuperRequest',function(pwd) {
    if(!(pwd == "Colocasia9191")) {
      console.log("pwd incorrect: "+pwd);
      return(socket.emit('infoResponse',"Incorrect Password"));
    }
    // password is correct so carry on
    AUTHUSERS[socket.id] = 31415926;
    JB['jbname'] = "JB-SuperAdmin";
    JB['jbid'] = 31415926;
    console.log("Super signed in");
    socket.emit("SignInSuperResponse",JB);
  });

  socket.on('logoutRequest',function(token) {
    AUTHUSERS[socket.id] = false;
    JB = new Object();  // delete the JB global so user needs to login again
    console.log("Logged out: "+socket.id)
    autherror(socket,"Logged out");
  });

	socket.on('loadJokesRequest',function() {
    if(AUTHUSERS[socket.id] != JB.jbid) return(autherror(socket));
    const str = "Loading Jokes to DB from file "+QFile;
		console.log(str);
    loadjokes(QFile,socket);
		socket.emit('infoResponse',str);
  });

  socket.on('createAppRequest',function() {
    if(AUTHUSERS[socket.id] != JB.jbid) return(autherror(socket));
    const myobj = jbt.newAppObject();
    console.log("New app: "+JSON.stringify(myobj));
    dbt.createApp(myobj,function(obj){
      socket.emit('createAppResponse',obj);
    });
  });

  socket.on('viewAppRequest',function() {
    if(AUTHUSERS[socket.id] != JB.jbid) return(autherror(socket));
    console.log("Viewing all apps");
    dbt.viewApps(function(obj) {
      socket.emit('viewAppResponse',obj);
    });
  });

  socket.on('getCatsRequest',function() {
    if(AUTHUSERS[socket.id] != JB.jbid) return(autherror(socket));
    console.log("Getting categories");
    dbt.getCategories(function(cats) {
      console.log("Categories are: "+cats);
  		socket.emit('getCatsResponse',cats);
    });
  });

  socket.on('getJokesByCatRequest',function(cat) {
    if(AUTHUSERS[socket.id] != JB.jbid) return(autherror(socket));
    console.log("Getting Jokes of category: "+cat);
    dbt.getJokesByCat(cat,function(qlist) {
      socket.emit('getJokesResponse',qlist);
    });
  });

  socket.on('getJokeByIdRequest',function(jid) {
    if(AUTHUSERS[socket.id] != JB.jbid) return(autherror(socket));
//    console.log("Getting question with ID: "+qid);
    dbt.getQuestionById(qid,function(question) {
      //    console.log(question);
      socket.emit("getQuestionByIdResponse",question);
    });
 });

  socket.on('updateJokeRequest',function(qobj) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
//    console.log("Updating question with ID: "+qobj.qid);
    let obj = qmt.verifyquestion(qobj);  // check that question has correct values
    if(obj != null) {
      dbt.updateQuestion(obj,function(res) {
//        console.log("Successfully updated");
        socket.emit("updateQuestionResponse","Question Updated: "+res.qid);
      });
    }
  });

}); //end of io.on

/*******************************************
/* Functions below this point
********************************************/
function removeSocket(id,evname) {
		console.log("Socket "+id+" "+evname+" at "+ new Date().toISOString());
    delete AUTHUSERS[id];
}

function loadjokes(file,socket) {
    var joke;
    dbt.clearAllJokes();
    var contents = fs.readFileSync(file);
    var jsonContent = JSON.parse(contents);

    jsonContent.forEach(obj => {
//      console.log("Joke: "+obj.Joke);
        joke = jbt.validateJoke(obj);
        dbt.insertJoke(joke);
      });

    socket.emit('infoResponse',"Jokes loaded: "+jsonContent.length);
}

// check app id and api key match
// if they do then create a new token and add to active token list
function jbauthenticate(appid,apikey,callback) {
  dbt.authenticate(appid,apikey,function(result) {
    if(result) {  // api key is valid so create token
      const token = jbt.createToken(appid);
      ActiveTokens[token.access_token] = new Object({"app_id":appid,"expires":token.expires});
      callback(token);
    }
    else
      callback(null);
  });
}

function autherror(socket,msg) {
  if(!msg)
    msg = "Please login as admin";
  socket.emit("errorResponse",msg);
}

