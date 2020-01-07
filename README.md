# Trivia-Sockets

This program implements the server and client for a real-time multiplayer trivia game. The server will be responsible for serving up all necessary resources (HTML, Javascript, etc.) and coordinating the communication between multiple clients using Socket.io. The client will be responsible for displaying questions, allowing the user to answer questions, and displaying the scores of players in the game.
Basic Trivia Game Rules
1. The first round of trivia should start when the first user joins. If all the players leave at any point (i.e., there are no users connected), the current round should be aborted and a new round should start when the next person joins.
2. Each round of trivia will consist of five multiple choice questions.
3. At the start of each round, every player’s score should be set to 0.
4. For each question, each player should only be able to select their answer once. To avoid cheating, additional answers should be disabled or ignored.
5. If a player’s answer is incorrect, that player should lose 100 points.
6. If a player’s answer is correct, that player should gain 100 points.
7. The round should only proceed to the next question after all connected players have answered.
8. When a round is over, all players should be shown the name(s) of the winner(s) and a new round should start.
9. If a player joins during the middle of a round, they can start playing immediately.

The server should start a new round when the first player joins. If all players leave, the server should stop the current round and start a new round when the next player joins.

The client features:
1) Allows the player to enter their name and choose to join the game.
2) Allows the player to see multiple choice questions and select answers.
3) Shows the player their score.
4) Shows the player the names of other players in the game and their scores.
5) Updates the display whenever the game state changes (e.g., when a player's score increases, the current question is changed)
6) Allows each client to see the status of others in the game (whether they have answered or not). T

There is an additional feature of a statistics page that shows information about each player, such as average score, number of games played abd number of wins. Also the statistics are stored in a file so that the statistics are remembered even if the server is restarted.
