//header files
const http = require('http');
const fs = require('fs');
let f = require('fs');

//global variables
let allPlayers = [];
let readPl = [];
let gamesPlayed = 0;
let pCounter = 0;
let players = [];
let trQuestions;
let nRound = true;
let qIndex = 0;
let nP = 0;
let aQ = [];
//Helper function for sending 404 message
function send404(response) {
	response.writeHead(404, { 'Content-Type': 'text/plain' });
	response.write('Error 404: Resource not found.');
	response.end();
}
//create the server
//server up one of the three resources or send the error message
let server = http.createServer(function (req, res) {
	if (req.method == 'GET') {
		if (req.url == '/'){
            fs.readFile('trivia.html', function(err, data) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
              });
        }
	      else if (req.url == '/style.css'){
            fs.readFile('style.css', function(err, data) {
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data);
                res.end();
              });
        }
		    else if (req.url == '/script.js'){
            fs.readFile('script.js', function(err, data) {
                res.writeHead(200, {'Content-Type': 'application/javascript'});
                res.write(data);
                res.end();
              });
        }
	}
  else{ //if not a GET request, send 404 for now by default
		send404(res);
	}
});

server.listen(3000);
console.log('server running on port 3000');

//create a request using the request module
const request = require('request');

const options = {
	url: 'https://opentdb.com/api.php?amount=5',
	method: 'GET',
	headers: {
		'Accept': 'text/html',
		'Accept-Charset': 'utf-8'
	}
};

//perform the actual request and store the response
function re(){
	console.log("#numPlayers is "+ players.length);
	request(options, function(err, res, body) {
		trQuestions = JSON.parse(body);
		console.log(trQuestions);
	});
}
//function that ushers in a new round
function newRound(){
	if (players.length>0){
		for (let i=0; i<players.length; i++){
			players[i].score = 0;
		}
	}
	qIndex = 0;
	re();

}
//compare function to sort the players by score
function compare( a, b ) {
  if ( a.score < b.score ){
      return 1;
  }
  if ( a.score > b.score ){
      return -1;
  }
  return 0;
}
//create the socket
const io = require("socket.io")(server);
io.on('connection', socket =>{
	if (nRound){ //calls on the newRound() method as soon as a player joins for the first time
		newRound();
		nRound = false;
	}

  socket.on('disconnect', () => {
		//if disconnected, remove that player from the players array
		let sPindex = 0;
    if (socket.username != undefined){
      console.log(socket.username + " disconected");
			for (let i=0; i<players.length; i++){
				if (socket.username==players[i].name){
					sPindex = i;
				}
			}
      players.splice(sPindex, 1);
      console.log(players);
      io.emit("newPlayer", JSON.stringify({people: players}));
			console.log("Current aLl players: "+JSON.stringify(allPlayers));
			//something that corrects the wins number
			for (let i=0; i<allPlayers.length; i++){
				if (allPlayers[i].name==socket.username){
					if (allPlayers[i].wins==1){
						break;
					}
					if (allPlayers[i].wins==6){
						allPlayers[i].wins /=6;
					}
					else{
						allPlayers[i].wins -=6;
						allPlayers[i].wins += 1;
					}

				}
			}
			//write the players data to the file
			f.writeFile('stats.txt', JSON.stringify(allPlayers), function (err) {
				if (err) throw err;
				});
			if (players.length!=0){ //if there are remaining players than keep going, othewrise start a new round
				io.emit("tQuestions", JSON.stringify({tqs: trQuestions}), players.length, qIndex);
			}
			else{
				nRound = true;
				nP = 0;
			}
    }
	})
  socket.on("getNumP", () => { //send number of players
		console.log("Number of players: "+ players.length);
		io.emit("numPlayer", players.length);
	})
  socket.on("add", player => { //add players to the players array and the allPlayers array for file writing
		console.log("Player " + player.name +" has joined");
		players.push(player);
    socket.username = player.name;
		f.readFile('stats.txt', function(err, data) {
			allPlayers = JSON.parse(data);
			console.log("File data: ");
			console.log(JSON.parse(data));
			console.log("ReadPl: "+JSON.stringify(allPlayers));
			let pL = {
		      name: player.name,
		      games: 0,
		      wins: 0
		  }
			if (allPlayers.length==0){
				allPlayers.push(pL);
				allPlayers[0].games = 1;
			}
			else{
				pCounter = 0;
				for (let i=0; i<allPlayers.length; i++){
					if (allPlayers[i].name == player.name){
						allPlayers[i].games+=1;
					}
					else{
						pCounter++;
					}
				}
				if (pCounter==allPlayers.length){
					allPlayers.push(pL);
					allPlayers[allPlayers.length-1].games = 1;
				}
			}
			console.log("All Players ever "+JSON.stringify(allPlayers));
  	});

		io.emit("newPlayer", JSON.stringify({people: players}));
	})
	socket.on("incQ", (qI, pName, score) => { //check if everyone has answered the question and then move on to the next question
		console.log("pName: "+pName);

		for (let i=0; i<players.length; i++){
				if (pName==players[i].name){
					nP++;
					aQ.push(i);
					players[i].score += score;
				}
		}
		if (nP==players.length){
			nP=0;
			aQ = [];
			console.log("All players have answered");
			console.log("nP: "+nP);
			console.log("New qIndex: "+qI);
			qIndex = qI;
			for (let i=0; i<players.length; i++){
				players[i].answered = false;
			}
			io.emit("newPlayer", JSON.stringify({people: players}));
			io.emit("tQuestions", JSON.stringify({tqs: trQuestions}), players.length, qIndex);
		}
		else{
			for (let i=0; i<aQ.length; i++){
					players[aQ[i]].answered = true;
					io.emit("newPlayer", JSON.stringify({people: players}));
			}
		}

	})
	socket.on("getQuestions", () => { //send questions to the client
		console.log("Fetching Questions "+trQuestions["results"][0]["question"]);
		io.emit("tQuestions", JSON.stringify({tqs: trQuestions}), players.length, qIndex);
	})
	socket.on("shoW", () => { //send the soreted array of players, by score
		let sortedP = players;
		for (let i=0; i<players.length; i++){
			sortedP.sort(compare);
		}
		let six = 0;
		for (let i=0; i<allPlayers.length; i++){
			if (allPlayers[i].name == sortedP[0].name){
				six = i;
				allPlayers[i].wins+=1;
			}
		}
		io.emit("dispW", JSON.stringify({people: sortedP}));
	})
	socket.on("getS", () => { //send the statistics array
		 let fileP;
		f.readFile('stats.txt', function(err, data) {
		  let fileP = JSON.parse(data);
			io.emit("pStats", JSON.stringify({people: fileP}));
		});

	})
	socket.on("nR", (pName) => { //force a new round
		console.log("ENDDDD");
		socket.username = pName;
		socket.disconnect();
	})
})
