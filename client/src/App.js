import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import Table from "react-bootstrap/Table";
import Penduel from "./contracts/Penduel.json";
import getWeb3 from "./getWeb3";
import "./App.css";
import logoApp from "./image/hangman-vs-blck.png";
import logoMetamask from "./image/MetaMask_Fox.png";
import timer from "./image/timer.png";
import plus from "./image/plus.png";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    playerGames: null,
    arrayGames: null,
    reachebleGames: null,
    inGameBalance: null,
    owner: null,
  };
  componentWillMount = async () => {
    try {
      // Récupérer le provider web3
      const web3 = await getWeb3();

      // Utiliser web3 pour récupérer les comptes de l’utilisateur (MetaMask dans notre cas)
      const accounts = await web3.eth.getAccounts();

      // Récupérer l’instance du smart contract “Penduel” avec web3 et les informations du déploiement du fichier (client/src/contracts/Whitelist.json)
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Penduel.networks[5];

      const instance = new web3.eth.Contract(
        Penduel.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runInit);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`
      );
      console.error(error);
    }
  };

  // les states qui doivent etre actualisé
  runInit = async () => {
    const { contract, accounts, web3 } = this.state;
    const owner = "0x8014Dd2b5f8a6513A7c4116D961cb5872F4bcA1b";
    this.setState({ owner: owner });

    const inGameBalance = await contract.methods.balance(accounts[0]).call();
    this.setState({ inGameBalance: inGameBalance });

    // récupérer la listes des parties du joueur connecté
    const playerGames = await contract.methods
      .getPlayerGames(accounts[0])
      .call();
    console.log(playerGames);
    this.setState({ playerGames: playerGames });

    const rngNotFound = async (id) => {
      const { accounts, contract } = this.state;
      await contract.methods.refundRNGnotFound(id).send({ from: accounts[0] });
    };

    // a modifié pour que l'input soit dans le scop
    const play = async (letter, id) => {
      const { accounts, contract } = this.state;
      console.log(letter);
      console.log(typeof letter);
      await contract.methods.play(letter, id).send({ from: accounts[0] });
      this.runInit();
    };

    const requestWinTimeout = async (id) => {
      const { accounts, contract } = this.state;
      await contract.methods.requestWinTimeout(id).send({ from: accounts[0] });
    };

    const cancelGame = async (id) => {
      const { accounts, contract } = this.state;
      await contract.methods.requestCancelGame(id).send({ from: accounts[0] });
      this.runInit();
    };

    // initialisation de l'array qui contient les infos des differentes parties de l'utilisateurs
    const arrayGames = [];

    // function qui lis et oragnise les données
    async function loopGames() {
      // on parcours l'essemble des sessions du joueur
      for (let i = 0; i < playerGames.length; i++) {
        const game = await contract.methods
          .sessionPublic(playerGames[i])
          .call();
        const rowArray = Object.values(game);
        const rawArrayGame = rowArray.splice(9, rowArray.length);

        const pOne = rawArrayGame[0];
        const pTwo = rawArrayGame[1];
        const mustPlay = rawArrayGame[2];
        const wordLength = rawArrayGame[3];
        const id = rawArrayGame[4];
        const betSize = rawArrayGame[5];
        const rawPOneGuess = rawArrayGame[6];
        const rawPTwoGuess = rawArrayGame[7];
        const status = rawArrayGame[8];

        let opponent;
        let playerTurn;
        let userGuess;
        let textEndgame;
        let toRender;
        let index;
        let renderRNGButton;

        // création du rendu selon l'etat de la partie
        // si la partie est joigable
        if (status == 1) {
          index = 0;
          toRender = (
            <>
              {" "}
              <div
                className="game"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card className="game--card">
                  <Card.Header>
                    Game ID: {id} Bet Size: {betSize} Wei Created By: You
                  </Card.Header>
                  <Card.Body className="card-body">
                    <img className="timer-img" src={timer} />
                    <h5>Await for a Second Player</h5>
                    <div
                      align="center"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <Card style={{ width: "20rem" }}>
                        <Card.Header>
                          <strong>Cancel the game</strong>
                        </Card.Header>
                        <Card.Body>
                          <Button
                            title="if no one has joined your party within 24 hours you can cancel the game"
                            onClick={() => cancelGame(id)}
                            variant="outline-danger"
                          >
                            {" "}
                            Cancel{" "}
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </>
          );

          arrayGames.push([index, id, toRender]);

          // si la partie est en cours
        } else if (status == 2) {
          index = 1;
          if (pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
          } else {
            opponent = pOne;
            userGuess = rawPTwoGuess;
          }

          if (wordLength == 0) {
            renderRNGButton = (
              <>
                <div
                  className="game"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <Card className="game--card" style={{ width: "20rem" }}>
                    <Card.Header>
                      <strong>Refunding: Request RNG Time Out</strong>
                    </Card.Header>
                    <Card.Body>
                      <Button
                        title="Usually the chainlink rng provides a random number quite quickly (about 3min). After 3 hours if no words could be drawn you can request a refund."
                        onClick={() => rngNotFound(id)}
                        variant="outline-danger"
                      >
                        {" "}
                        Request{" "}
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              </>
            );
          }

          // ici on convertie le mot du joueur de bytes32 à utf8
          let hexString = userGuess.slice(2, 2 + wordLength * 2);
          let guessString = "";
          for (let j = 0; j < hexString.length; j = j + 2) {
            if (hexString[j] + hexString[j + 1] == "00") {
              guessString = guessString + " _ ";
            } else {
              let toConvert = `0x${hexString[j]}${
                hexString[j + 1]
              }00000000000000000000000000000000000000000000000000000000000000`;
              guessString =
                guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            }
          }

          if (mustPlay == accounts[0]) {
            playerTurn = "Your Turn";
            toRender = (
              <>
                {" "}
                <div
                  className="game"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <Card className="game--card">
                    <Card.Header>
                      Game ID: {id} Bet Size: {betSize} Wei Opponent:{" "}
                      {`${opponent.toString().slice(0, -37)}...${opponent
                        .toString()
                        .slice(-3)}`}
                    </Card.Header>
                    <Card.Body className="card-body">
                      <p>{playerTurn}</p>
                      <p>
                        your guess: <h1>{guessString}</h1>
                      </p>
                      <p>Game: In Progress</p>

                      <p>{renderRNGButton}</p>

                      <div
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <Card style={{ width: "20rem" }}>
                          <Card.Header>
                            <strong>Play</strong>
                          </Card.Header>
                          <Card.Body>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x61", id);
                              }}
                              variant="outline-primary"
                            >
                              A
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x62", id);
                              }}
                              variant="outline-primary"
                            >
                              B
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x63", id);
                              }}
                              variant="outline-primary"
                            >
                              C
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x64", id);
                              }}
                              variant="outline-primary"
                            >
                              D
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x65", id);
                              }}
                              variant="outline-primary"
                            >
                              E
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x66", id);
                              }}
                              variant="outline-primary"
                            >
                              F
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x67", id);
                              }}
                              variant="outline-primary"
                            >
                              G
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x68", id);
                              }}
                              variant="outline-primary"
                            >
                              H
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x69", id);
                              }}
                              variant="outline-primary"
                            >
                              I
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x6a", id);
                              }}
                              variant="outline-primary"
                            >
                              J
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x6b", id);
                              }}
                              variant="outline-primary"
                            >
                              K
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x6c", id);
                              }}
                              variant="outline-primary"
                            >
                              L
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x6d", id);
                              }}
                              variant="outline-primary"
                            >
                              M
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x6e", id);
                              }}
                              variant="outline-primary"
                            >
                              N
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x6f", id);
                              }}
                              variant="outline-primary"
                            >
                              O
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x70", id);
                              }}
                              variant="outline-primary"
                            >
                              P
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x71", id);
                              }}
                              variant="outline-primary"
                            >
                              Q
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x72", id);
                              }}
                              variant="outline-primary"
                            >
                              R
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x73", id);
                              }}
                              variant="outline-primary"
                            >
                              S
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x74", id);
                              }}
                              variant="outline-primary"
                            >
                              T
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x75", id);
                              }}
                              variant="outline-primary"
                            >
                              U
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x76", id);
                              }}
                              variant="outline-primary"
                            >
                              V
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x77", id);
                              }}
                              variant="outline-primary"
                            >
                              W
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x78", id);
                              }}
                              variant="outline-primary"
                            >
                              X
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x79", id);
                              }}
                              variant="outline-primary"
                            >
                              Y
                            </Button>
                            <Button
                              style={{ margin: "1px" }}
                              onClick={() => {
                                play("0x7a", id);
                              }}
                              variant="outline-primary"
                            >
                              Z
                            </Button>
                          </Card.Body>
                        </Card>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </>
            );
          } else {
            playerTurn = "Await your turn";
            toRender = (
              <>
                <div
                  className="game"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <Card className="game--card">
                    <Card.Header>
                      Game ID: {id} Bet Size: {betSize} Wei Opponent:{" "}
                      {`${opponent.toString().slice(0, -37)}...${opponent
                        .toString()
                        .slice(-3)}`}
                    </Card.Header>
                    <Card.Body>
                      <p>{playerTurn}</p>
                      <p>
                        your guess: <h1>{guessString}</h1>
                      </p>
                      <p>Game: In Progress</p>
                      <p>{renderRNGButton}</p>

                      <div
                        align="center"
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <Card style={{ width: "20rem" }}>
                          <Card.Header>
                            <strong>Request Victory: Oppent TimeOut</strong>
                          </Card.Header>
                          <Card.Body>
                            <Button
                              title="If your opponent takes longer than 24 hours to play, you can request a TimeOut Victory."
                              onClick={() => requestWinTimeout(id)}
                              variant="outline-danger"
                            >
                              {" "}
                              Request{" "}
                            </Button>
                          </Card.Body>
                        </Card>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </>
            );
          }

          arrayGames.push([index, id, toRender]);

          // Player One Win
        } else if (status == 3) {
          index = 2;
          if (pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
            textEndgame = `Victory!! ${
              betSize * 2
            } Wei have been credited to your in-game balance `;
          } else {
            opponent = pOne;
            userGuess = rawPTwoGuess;
            textEndgame = `Defeat`;
          }

          let hexString = userGuess.slice(2, 2 + wordLength * 2);
          let guessString = "";
          for (let j = 0; j < hexString.length; j = j + 2) {
            if (hexString[j] + hexString[j + 1] == "00") {
              guessString = guessString + " _ ";
            } else {
              let toConvert = `0x${hexString[j]}${
                hexString[j + 1]
              }00000000000000000000000000000000000000000000000000000000000000`;
              guessString =
                guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            }
          }

          let toRender = (
            <>
              <div
                className="game"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card className="game--card">
                  <Card.Header>
                    Game ID: {id} Bet Size: {betSize} Wei VS:{" "}
                    {`${opponent.toString().slice(0, -37)}...${opponent
                      .toString()
                      .slice(-3)}`}
                  </Card.Header>
                  <Card.Body>
                    <p>
                      your guess: <h1>{guessString}</h1>
                    </p>
                    <h5>{textEndgame}</h5>
                  </Card.Body>
                </Card>
              </div>
            </>
          );

          arrayGames.push([index, id, toRender]);

          // Player two Win
        } else if (status == 4) {
          index = 2;
          if (pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
            textEndgame = `Defeat`;
          } else {
            opponent = pOne;
            userGuess = rawPTwoGuess;
            textEndgame = `Victory!! ${
              betSize * 2
            } Wei have been credited to your in-game balance `;
          }

          let hexString = userGuess.slice(2, 2 + wordLength * 2);
          let guessString = "";
          for (let j = 0; j < hexString.length; j = j + 2) {
            if (hexString[j] + hexString[j + 1] == "00") {
              guessString = guessString + " _ ";
            } else {
              let toConvert = `0x${hexString[j]}${
                hexString[j + 1]
              }00000000000000000000000000000000000000000000000000000000000000`;
              guessString =
                guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            }
          }

          let toRender = (
            <>
              <div
                className="game"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card className="game--card">
                  <Card.Header>
                    Game ID: {id} Bet Size: {betSize} Wei VS:{" "}
                    {`${opponent.toString().slice(0, -37)}...${opponent
                      .toString()
                      .slice(-3)}`}
                  </Card.Header>
                  <Card.Body>
                    <p>
                      your guess: <h1>{guessString}</h1>
                    </p>
                    <h5>{textEndgame}</h5>
                  </Card.Body>
                </Card>
              </div>
            </>
          );

          arrayGames.push([index, id, toRender]);

          // Draw
        } else if (status == 5) {
          index = 2;
          if (pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
          } else {
            opponent = pOne;
            userGuess = rawPTwoGuess;
          }

          textEndgame = `Draw! ${betSize} Wei have been credited to your in-game balance `;
          let hexString = userGuess.slice(2, 2 + wordLength * 2);
          let guessString = "";
          for (let j = 0; j < hexString.length; j = j + 2) {
            if (hexString[j] + hexString[j + 1] == "00") {
              guessString = guessString + " _ ";
            } else {
              let toConvert = `0x${hexString[j]}${
                hexString[j + 1]
              }00000000000000000000000000000000000000000000000000000000000000`;
              guessString =
                guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            }
          }

          let toRender = (
            <>
              <div
                className="game"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card className="game--card">
                  <Card.Header>
                    Game ID: {id} Bet Size: {betSize} Wei VS:{" "}
                    {`${opponent.toString().slice(0, -37)}...${opponent
                      .toString()
                      .slice(-3)}`}
                  </Card.Header>
                  <Card.Body>
                    <p>
                      your guess: <h1>{guessString}</h1>
                    </p>
                    <h5>{textEndgame}</h5>
                  </Card.Body>
                </Card>
              </div>
            </>
          );

          arrayGames.push([index, id, toRender]);

          // Cancelled by creator of the game
        } else if (status == 6) {
          index = 3;
          textEndgame = `Game Cancelled! ${betSize} Wei have been credited to your in-game balance `;

          let toRender = (
            <>
              {" "}
              <div
                className="game"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card className="game--card">
                  <Card.Header>
                    Game ID: {id} Bet Size: {betSize} Wei
                  </Card.Header>
                  <Card.Body>
                    <h5>{textEndgame}</h5>
                  </Card.Body>
                </Card>
              </div>
            </>
          );

          arrayGames.push([index, id, toRender]);

          // Player One Win by TimeOut
        } else if (status == 7) {
          index = 2;
          if (pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
            textEndgame = `Victory by TimeOut! ${
              betSize * 2
            } Wei have been credited to your in-game balance `;
          } else {
            opponent = pOne;
            userGuess = rawPTwoGuess;
            textEndgame = `Defeat! More than 24 hours have passed since\n your opponent's last move, he has requested a TimeOut Victory `;
          }

          let hexString = userGuess.slice(2, 2 + wordLength * 2);
          let guessString = "";
          for (let j = 0; j < hexString.length; j = j + 2) {
            if (hexString[j] + hexString[j + 1] == "00") {
              guessString = guessString + " _ ";
            } else {
              let toConvert = `0x${hexString[j]}${
                hexString[j + 1]
              }00000000000000000000000000000000000000000000000000000000000000`;
              guessString =
                guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            }
          }

          let toRender = (
            <>
              {" "}
              <div
                className="game"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card className="game--card">
                  <Card.Header>
                    Game ID: {id} Bet Size: {betSize} Wei VS:{" "}
                    {`${opponent.toString().slice(0, -37)}...${opponent
                      .toString()
                      .slice(-3)}`}
                  </Card.Header>
                  <Card.Body>
                    <p>
                      your guess: <h1>{guessString}</h1>
                    </p>
                    <h5>{textEndgame}</h5>
                  </Card.Body>
                </Card>
              </div>
            </>
          );

          arrayGames.push([index, id, toRender]);

          // Player Two Win by Timeout
        } else if (status == 8) {
          index = 2;
          if (pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
            textEndgame = `Defeat! More than 24 hours have passed since\n your opponent's last move, he has requested a TimeOut Victory `;
          } else {
            opponent = pOne;
            userGuess = rawPTwoGuess;
            textEndgame = `Victory by TimeOut! ${
              betSize * 2
            } Wei have been credited to your in-game balance `;
          }

          let hexString = userGuess.slice(2, 2 + wordLength * 2);
          let guessString = "";
          for (let j = 0; j < hexString.length; j = j + 2) {
            if (hexString[j] + hexString[j + 1] == "00") {
              guessString = guessString + " _ ";
            } else {
              let toConvert = `0x${hexString[j]}${
                hexString[j + 1]
              }00000000000000000000000000000000000000000000000000000000000000`;
              guessString =
                guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            }
          }

          let toRender = (
            <>
              <div
                className="game"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card className="game--card">
                  <Card.Header>
                    Game ID: {id} Bet Size: {betSize} Wei VS:{" "}
                    {`${opponent.toString().slice(0, -37)}...${opponent
                      .toString()
                      .slice(-3)}`}
                  </Card.Header>
                  <Card.Body>
                    <p>
                      your guess: <h1>{guessString}</h1>
                    </p>
                    <h5>{textEndgame}</h5>
                  </Card.Body>
                </Card>
              </div>
            </>
          );

          arrayGames.push([index, id, toRender]);
        }
      }
    }
    await loopGames();
    console.log(arrayGames);
    arrayGames.sort();
    console.log(arrayGames);
    this.setState({ arrayGames: arrayGames });

    const reachebleGames = [];
    async function loopReachableGames() {
      const totalCreatedGames = await contract.methods
        .totalCreatedSessions()
        .call();

      for (let i = 0; i <= totalCreatedGames; i++) {
        const game = await contract.methods.sessionPublic(i).call();
        const rowArray = Object.entries(game);
        const arrayInfoGame = rowArray.splice(9, rowArray.length);

        if (arrayInfoGame[8][1] == 1) {
          const arrayToPush = arrayInfoGame[4].concat(
            arrayInfoGame[5],
            arrayInfoGame[0]
          );
          reachebleGames.push(arrayToPush);
        }
      }
    }
    await loopReachableGames();
    this.setState({ reachebleGames: reachebleGames });
  };

  rngNotFound = async (id) => {
    const { accounts, contract } = this.state;
    await contract.methods.refundRNGnotFound(id).send({ from: accounts[0] });
  };

  withdraw = async () => {
    const { accounts, contract } = this.state;
    await contract.methods.playerWithdraw().send({ from: accounts[0] });
    this.runInit();
  };

  createSession = async () => {
    const { accounts, contract } = this.state;
    const bet = this.bet.value;
    await contract.methods
      .createSession()
      .send({ from: accounts[0], value: bet });
    this.runInit();
  };

  joinSession = async (id, bet) => {
    const { accounts, contract } = this.state;
    await contract.methods
      .joinSession(id)
      .send({ from: accounts[0], value: bet });
    this.runInit();
  };

  pausedJoinSessionFct = async () => {
    const { accounts, contract } = this.state;
    await contract.methods.pausedJoinSessionFct().send({ from: accounts[0] });
    this.runInit();
  };

  openJoinSessionFct = async () => {
    const { accounts, contract } = this.state;
    await contract.methods.openJoinSessionFct().send({ from: accounts[0] });
    this.runInit();
  };

  addWord = async () => {
    const { accounts, contract, web3 } = this.state;

    const string = this.string.value;
    console.log(string);
    const lowerString = string.toLowerCase();
    console.log(lowerString);
    const word = web3.utils.utf8ToHex(lowerString);
    console.log(word);
    console.log(typeof word);
    await contract.methods.addWord(word).send({ from: accounts[0] });
  };

  render() {
    // on recupere les state
    const { arrayGames, reachebleGames, accounts, inGameBalance, owner } =
      this.state;

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <div className="app">
        <Navbar collapseOnSelect expand="lg" bg="primary" variant="dark">
          <Container fluid>
            <Navbar.Brand href="#home">Penduel</Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link href="#join">Join</Nav.Link>
                <Nav.Link href="#session">Your sessions</Nav.Link>
                <Nav.Link href="#">
                  In-Game Balance: {inGameBalance} wei{" "}
                </Nav.Link>

                <Button
                  className="withdraw-button"
                  onClick={this.withdraw}
                  variant="secondary"
                  size="sm"
                >
                  {" "}
                  withdraw{" "}
                </Button>

                {accounts[0] == owner ? (
                  <>
                    <Nav.Link href="#admin">Admin</Nav.Link>
                  </>
                ) : (
                  <></>
                )}
              </Nav>
              <Nav>
                <Button
                  className="header--connect"
                  title="Connected Account"
                  variant="secondary"
                >
                  <img src={logoMetamask} />
                  <p>
                    {" "}
                    {accounts != undefined
                      ? `${accounts.toString().slice(0, -37)}...${accounts
                          .toString()
                          .slice(-3)}`
                      : "Connect"}
                  </p>
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <div className="body">
          <div id="join" className="body-first-section">
            <div
              className="join"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <Card className="join-card">
                <Card.Header>
                  <strong>Join</strong>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Game ID // Bet Size // Created By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reachebleGames !== null &&
                            reachebleGames.map((a) => (
                              <>
                                <tr>
                                  <td className="tbl-line">
                                    <p>Game ID: {a[1]}</p>
                                    <p>Bet Size: {a[3]} wei</p>
                                    <p>
                                      Created By:{" "}
                                      {`${a[5]
                                        .toString()
                                        .slice(0, -37)}...${a[5]
                                        .toString()
                                        .slice(-3)}`}
                                    </p>
                                    <Button
                                      className="join-btn"
                                      onClick={() => {
                                        this.joinSession(a[1], a[3]);
                                      }}
                                      variant="primary"
                                    >
                                      {" "}
                                      join{" "}
                                    </Button>
                                  </td>
                                </tr>
                              </>
                            ))}
                        </tbody>
                      </Table>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </div>

          <div
            id="session"
            className="your-session"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Card className="card-section">
              <Card.Header>
                <strong>Your sessions</strong>
              </Card.Header>
              <Card.Body className="body-sessions">
                <tbody className="tbl">
                  <div
                    className="create-session"
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <Card
                      className="card-new"
                      style={{ alignContent: "center" }}
                    >
                      <Card.Header>
                        <strong>Create New Game</strong>
                      </Card.Header>
                      <Card.Body className="create-session-body">
                        <img className="new--img" src={plus} />
                        <Form.Group id="createSession">
                          <Form.Control
                            type="number"
                            className="betsize"
                            placeholder="Bet Size in Wei"
                            ref={(input) => {
                              this.bet = input;
                            }}
                          />
                        </Form.Group>
                        <Button onClick={this.createSession} variant="primary">
                          {" "}
                          Create{" "}
                        </Button>
                      </Card.Body>
                    </Card>
                  </div>
                  {arrayGames !== null &&
                    arrayGames.map((b) => (
                      <div className="tbl-game">{b[2]}</div>
                    ))}
                </tbody>
              </Card.Body>
            </Card>
          </div>

          {accounts[0] == owner ? (
            <>
              <div
                id="admin"
                className="admin"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <Card>
                  <Card.Header>
                    <strong>(Only Admin)</strong>{" "}
                  </Card.Header>
                  <Card.Body>
                    <Button
                      style={{ margin: "3px" }}
                      onClick={this.openJoinSessionFct}
                      variant="warning"
                    >
                      {" "}
                      openJoinSessionFct(){" "}
                    </Button>

                    <Button
                      style={{ margin: "6px" }}
                      onClick={this.pausedJoinSessionFct}
                      variant="danger"
                    >
                      {" "}
                      pausedJoinSessionFct(){" "}
                    </Button>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Card style={{ width: "30rem" }}>
                        <Card.Header>
                          <strong>Add Word</strong>
                        </Card.Header>
                        <Card.Body>
                          <Form.Group id="addword">
                            <Form.Control
                              type="text"
                              id="word"
                              placeholder="word"
                              ref={(input) => {
                                this.string = input;
                              }}
                            />
                          </Form.Group>

                          <Button
                            style={{ margin: "3px" }}
                            onClick={this.addWord}
                            variant="outline-primary"
                          >
                            {" "}
                            Add{" "}
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    );
  }
}

export default App;
