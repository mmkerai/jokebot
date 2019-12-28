var JB = new Object();
var $jtable,$atable,$select;

$(document).ready(function() {
	setDefaultValues();
//	signInSuper();
	$jtable = $('#btable');
	$atable = $('#abtable');
	$select = $('#select');
	$('#reviewj').submit(function(event) {
		event.preventDefault();
	});
});

function signInSuper() {
	var pass = prompt("Please enter the password", "");
	if(pass == null || pass == "") {
		return;
	}
	else {
		socket.emit('SignInSuperRequest',pass);
	}
}

function loadjokes() {
	console.log("Loading Jokes");
	clearMessages();
	socket.emit('loadJokesRequest','');
}

function createapp() {
	console.log("Creating app credentials");
	clearMessages();
	socket.emit('createAppRequest','');
}

function viewapps() {
	console.log("View app credentials");
	clearMessages();
	socket.emit('viewAppRequest','');
}

function reviewjokes() {
	console.log("Reviewing Jokes");
	clearMessages();
	socket.emit('getCatsRequest','');
}

function getjokes() {
	if(!JB)
		return($('#error').text("You need to login first"));

		console.log("Getting Jokes by Category:"+$('#jcat').val());
		$("#error").text("");
		$('#qtable').show();
		socket.emit('getJokesByCatRequest',$('#jcat').val());	
}

socket.on('createAppResponse',function(obj) {
	$("#error").text("");
	$("#message1").text("App Created");
	$("#message2").text("App ID: "+obj.app_id+" API Key: "+obj.api_key);
});

socket.on('SignInSuperResponse',function(jobj) {
	JB = jobj;
	setPostLoginValues(JB);
});

// Bootstrap table
socket.on('getJokesResponse',function(jlist) {
	$('#jtable').show();
	$('#atable').hide();
	$jtable.bootstrapTable({data: jlist});
});

// Bootstrap table
socket.on('viewAppResponse',function(alist) {
	$('#jtable').hide();
	$('#atable').show();
	$atable.bootstrapTable({data: alist});
});

$(function() {
    $select.click(function () {
      alert('getSelections: ' + JSON.stringify($table.bootstrapTable('getSelections')))
	});
});
