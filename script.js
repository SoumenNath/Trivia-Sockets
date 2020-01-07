//global variables
let qIndex = 0;
let qS = [];
let cAs = [];
let pName;

//initial function that calls on the server to display the number of players currently in game
function init(){
  let getNumP = null;
  getNumP = io();
  getNumP.on("numPlayer", nPlayer);
  getNumP.emit("getNumP");

}
//this function displays the number of players currently in game
function nPlayer(data){
  let numPs = document.getElementById("numPs");
  numPs.innerHTML = "";
  numPs.innerHTML = `<h3>The number of players in the game at this moment is `+data+`<h3>`;
}

//this functiion adds the user as a player and sends the info to the server
function login(text){
  pName = text;
  let signIn = document.querySelector("#siPage");
  let mainPage = document.querySelector("#mainPage");
  if(text.length>0){
    //if the user entered a username then display the game page and hide the login page
    let welcome = document.createElement("div");
    welcome.innerHTML = `<h3>Welcome Player `+text+`<h3>`;
    mainPage.insertBefore(welcome, mainPage.childNodes[0]);
    signIn.classList.remove("show");
		signIn.classList.add("hidden");
    mainPage.classList.remove("hidden");
		mainPage.classList.add("show");
  }
  else{
      alert("You have to enter a name");
  }
  //call on this function to send the player info to the server
  addPlayer(text);
}

// This function creates a new player with the username he/she entered and send the player obkect to the server
function addPlayer(text){
  let newPlayer = null;
  let player = {
      name: text,
      score: 0,
      answered: false
  }
  newPlayer = io();
  newPlayer.on("newPlayer", updatePage);
  newPlayer.emit("add", player);
  newPlayer.on("tQuestions", upDateQuestions);
  newPlayer.emit("getQuestions");
}

//This function updates the scores in the game page
function updatePage(data){
  init();
  let players = JSON.parse(data).people;
  let dScores = document.getElementById("displayScores");
  dScores.innerHTML = "";
  let oP = document.createElement("div");
  oP.innerHTML = `<h3>Players currently in the game: <h3>`;
  dScores.appendChild(oP);
  console.log(players);
  //for all the players currently in game, check if they have answered or not and highlight those who have not answered using the mark element
  for(i=0;i<players.length;i++){
    let player = document.createElement("div");
    if (players[i].answered==false){
      player.innerHTML= `<h3><mark>Name: `+players[i].name+`, <mark>Score: `+players[i].score+`<h3>`;
    }
    else{
      player.innerHTML= `<h3>Name: `+players[i].name+`, Score: `+players[i].score+`<h3>`;
    }

    dScores.appendChild(player);
  }
}

//This function updates the questions
function upDateQuestions(qData, lData, qI){
  qS = [];
  cAs=[];
  qIndex = qI;
  console.log("#Players in game: "+lData);
  let trQuestions = JSON.parse(qData).tqs;
  console.log(trQuestions);
  let dQs = document.getElementById("displayQuestions");
  dQs.innerHTML = "";
  //call on this function to render questions
  serveQuestion(trQuestions);
  //if the five questions have not been asked, display the appropriate question
  //otherwise, after all five questions have been asked, trigger the server to display the winner
  if (qIndex<5){
    dQs.appendChild(qS[qIndex]);
  }
  else{
    let sWin = null;
    sWin = io();
    sWin.on("dispW", displayWinner);
    sWin.emit("shoW");
  }

}

//this function displays the winner
function displayWinner(data){
  let dQs = document.getElementById("displayQuestions");
  dQs.innerHTML = "";
  //recieves data of the players sorted by score in descending order and displays the winner at index 0
  let players = JSON.parse(data).people;
  console.log(players);
  let player = document.createElement("div");
  player.innerHTML= `<h3>The winner for this round is: `+players[0].name+`<br>Please press the button below and then exit and open a new broweser as a new round will begin<h3>`;
  dQs.appendChild(player);
  let clearButton = document.createElement("INPUT");
  clearButton.setAttribute("type", "button");
  clearButton.setAttribute("value", "Move to New Round");
  clearButton.setAttribute("onclick", "clearQuestions()");
  dQs.appendChild(clearButton);
}

//this function triggeres the server to clear the current round
function clearQuestions(){
  console.log("Cleared Questions");
  let nR = null;
  nR  = io();
  nR.emit('nR', pName);
}

//this function gets the trivia questions from the server and appends them to the global variable
function serveQuestion(trQuestions){
  if (trQuestions["response_code"]!=0){
    alert("Error: Failed to retrieve questions, please try again soon!");
  }
	for (let i=0; i<5; i++){
		let dQuestions = document.createElement("div");
		let form = document.createElement("form");
	  form.name = "quizForm";
		let cAnswer = trQuestions["results"][i]["correct_answer"];
		let question = document.createElement("div");
		question.innerHTML = `<h3>Question: `+trQuestions["results"][i]["question"]+`</h3>`;
		form.appendChild(question);
		let answers = [];
	  let numAnswers = trQuestions["results"][i]["incorrect_answers"].length;
	  answers.push(cAnswer);
    cAs.push(cAnswer);
	  for (let j=0; j<numAnswers; j++){
	    answers.push(trQuestions["results"][i]["incorrect_answers"][j]);
	  }
    //randomize the answer order
    answers = reOrder(answers);
    console.log("Correct: "+cAnswer);
	  numAnswers++;
	  for (let j = 0; j <numAnswers; j++){
	    //appending the answers for each question to the form
	    let name = "q"+i;
	    let option = document.createElement("div");
	    //each answer will be represented with a radio button
	    option.innerHTML = `<input type="radio" name="`+name+`" value="`+answers[j]+`">`+answers[j]+``;
	    form.appendChild(option);
	  }
	  dQuestions.appendChild(form);
	  let checkButton = document.createElement("INPUT");
		checkButton.setAttribute("type", "button");
		checkButton.setAttribute("value", "Submit Answer");
		checkButton.setAttribute("onclick", "checkAnswer()");
		dQuestions.appendChild(checkButton);
		qS.push(dQuestions);
	}
}

//function to reorder the answers array

function reOrder(array) {
	let currentIndex = array.length;
	let temporaryValue;
	let randomIndex;
	// While there are elements to suffle, pick a remaing element using math.random and swap it with the current index
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

//function to check the answers of the players
function checkAnswer(){
  let score = 0;
  for (let i=0; i<5; i++){
    if (i==qIndex){
      if (document.forms["quizForm"]["q"+i] != undefined){
        console.log("Correct Answer for the q: "+cAs[i]);
        console.log("Your answer: "+document.forms["quizForm"]["q"+i].value);
        if (document.forms["quizForm"]["q"+i].value == cAs[i]){
            console.log("Right!");
            score += 100;
        }
        else{
          console.log("Wrong!");
          score -=100;
        }
        qIndex++;
        let upQ = null;
        upQ = io();
        upQ.on("tQuestions", upDateQuestions);
        upQ.on("newPlayer", updatePage);
        upQ.emit("incQ", qIndex, pName, score);
     }

    }
  }
}

//function that triggeres the server to send the stats file data to the client
function getStats(){
  let getStats = null;
  getStats = io();
  getStats.on("pStats", showStats);
  getStats.emit("getS");
}
//function that displays the stats page
function showStats(data){
  let allP = JSON.parse(data).people;
  console.log(allP);
  let sS = document.querySelector("#statsP");
  sS.innerHTML = "";
  let sHead = document.createElement("div");
  sHead.innerHTML = `<h3>All time player statistics: <h3><br>`;
  sS.appendChild(sHead);
  for (let i=0; i<allP.length; i++){
    let text ="Name: "+allP[i].name+"\nNumber of Games Played: "+allP[i].games+"\nNumber of Wins: "+allP[i].wins+"\n";
    let tNode = document.createTextNode(text);
    sS.appendChild(tNode);
    sS.appendChild((document.createElement("br")));
  }
}
