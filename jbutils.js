//var socket = io.connect();
var socket = io('', {
	'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 5
});

const version = "JBot v0.5";

function checksignedin() {
	JB = JSON.parse(sessionStorage.getItem("JB"));
	if(JB.jbname)
		socket.emit('LoginRequest',JB.jbname);
	clearMessages();
}

function signOut() {
	sessionStorage.removeItem('JB');
		socket.emit('logoutRequest',"");
		setDefaultValues();
		location.href = 'jsadmin.html';
      	console.log('User signed out.');
}

function setDefaultValues() {
	$('#version').text(version);
	$('#userbutton').hide();
	$('#signoutbutton').hide();
	$('#signinbutton').show();
	$('#jbadmin').hide();
	$('#jtable').hide();
	$('#atable').hide();
	clearMessages();
	console.log("Doc ready");
}

function setPostLoginValues(jb) {
	sessionStorage.setItem("JB",JSON.stringify(jb));
	$('#userbutton').text(jb.jbname);
	$('#signinbutton').hide();
	$('#signoutbutton').show();
	$('#userbutton').show();
	$('#jbadmin').show();
	clearMessages();
	console.log("User successfully signed in:"+jb.jbname);
}

function clearMessages() {
	$("#error").text("");
	$("#message1").text("");
	$("#message2").text("");
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

socket.on('disconnect', function () {
	socket.emit('logoutRequest',"");
});

socket.on('infoResponse', function(data) {
	$("#message1").text(data);
});

socket.on('errorResponse',function(data) {
	$('#error').text(data);
});

socket.on('getCatsResponse',function(cats) {
//	let items = Object.getOwnPropertyNames(cats);
	let items = cats;
	console.log("Cats are: "+items);
	$('#jcat').empty();
	//First entry in dropdown
	$('#jcat').append($('<option>', {
			value: "select",
			text : "select a category"
		}));
	// subsequent entries in dropdown
	$.each(items,function(i,item) {
    	$('#jcat').append($('<option>', {
        value: item,
        text : item
    	}));
	});
	$('#jcat option:selected').attr('disabled','disabled');
});

function readCookie(name)
{
  name += '=';
  var parts = document.cookie.split(/;\s*/);
  for (var i = 0; i < parts.length; i++)
  {
    var part = parts[i];
    if (part.indexOf(name) == 0)
      return part.substring(name.length);
  }
  return null;
}

/*
 * Saves a cookie for delay time. If delay is blank then no expiry.
 * If delay is less than 100 then assumes it is days
 * otherwise assume it is in seconds
 */
function saveCookie(name, value, delay)
{
  var date, expires;
  if(delay)
  {
	  if(delay < 100)	// in days
		  delay = delay*24*60*60*1000;	// convert days to milliseconds
	  else
		  delay = delay*1000;	// seconds to milliseconds
	  
	  date = new Date();
	  date.setTime(date.getTime()+delay);	// delay must be in seconds
	  expires = "; expires=" + date.toGMTString();		// convert unix date to string
  }
  else
	  expires = "";
  
  document.cookie = name+"="+value+expires+"; path=/";
}

/*
 * Delete cookie by setting expiry to 1st Jan 1970
 */
function delCookie(name) 
{
	document.cookie = name + "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
}
