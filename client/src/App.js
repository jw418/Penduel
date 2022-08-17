import React, { Component } from "react";
import {useRef} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Penduel from "./contracts/Penduel.json";
import getWeb3 from "./getWeb3";
import "./App.css";

class App extends Component {
  
  state = { web3: null, accounts: null, contract: null, playerGames: null, arrayGames: null, reachebleGames: null, inGameBalance: null};
  componentWillMount = async () => {
    try {
      // Récupérer le provider web3
      const web3 = await getWeb3();
  
      // Utiliser web3 pour récupérer les comptes de l’utilisateur (MetaMask dans notre cas) 
      const accounts = await web3.eth.getAccounts();

      // Récupérer l’instance du smart contract “Penduel” avec web3 et les informations du déploiement du fichier (client/src/contracts/Whitelist.json)
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Penduel.networks[networkId];
  
      const instance = new web3.eth.Contract(
        Penduel.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runInit);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`,
      );
      console.error(error);
    }
  };

  // les states qui doivent etre actualisé
  runInit = async() => {
    const { contract, accounts, web3 } = this.state;   

    const inGameBalance = await contract.methods.balance(accounts[0]).call();    
    this.setState({ inGameBalance: inGameBalance });    

    // récupérer la listes des parties du joueur connecté
    const playerGames = await contract.methods.getPlayerGames(accounts[0]).call();    
    this.setState({ playerGames: playerGames });

    const rngNotFound = async(id) => {
      const { accounts, contract} = this.state;
      await contract.methods.refundRNGnotFound(id).send({from: accounts[0]});
    }

    // a modifié pour que l'input soit dans le scop
    let letters;
    const play = async(id) => {
      const { accounts, contract, web3} = this.state;          
      console.log(letters);
      
      console.log(typeof letters);      
      const letter = web3.utils.utf8ToHex(letters);
      console.log(letter);
      console.log(typeof letter);    
      
      await contract.methods.play(letter, id).send({from: accounts[0]});
      this.runInit();
    }

    const requestWinTimeout = async(id) => {
      const { accounts, contract} = this.state;
      await contract.methods.requestWinTimeout(id).send({from: accounts[0]});
    }
  
    // initialisation de l'array qui contient les infos des differentes parties de l'utilisateurs
    const arrayGames = [];
    
    // function qui lis et oragnise les données
    async function loopGames() {

      // on parcours l'essemble des sessions du joueur
      for(let i = 0; i < playerGames.length; i++) {

        const game = await contract.methods.sessionPublic(playerGames[i]).call();     
        const rowArray = Object.values(game);        
        const rawArrayGame = rowArray.splice(9,rowArray.length);

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
        
        // création du rendu selon l'etat de la partie
        // si la partie est joigable
        if(status == 1) {
        
          let toRender =
          <>                       
            <p>Game ID: {id}  Bet Size: {betSize} Wei Created By: You</p>
            <p>Await for a Second Player</p>
          </>;        
          arrayGames.push([id, toRender]);
         
        // si la partie est en cours  
        }else if(status == 2) {
          
          if(pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
          }else{
            opponent= pOne;
            userGuess = rawPTwoGuess;
          }

          if(mustPlay == accounts[0]) {
            playerTurn = 'Your Turn'
          }else{
            playerTurn = 'Opponent Turn'
          }


          // ici on convertie le mot du joueur de bytes32 à utf8 
          let hexString = userGuess.slice(2, 2 + (wordLength*2));          
          let guessString="";
          for (let j=0; j< hexString.length; j= j+2){
            
            if (hexString[j]+ hexString[j+1]== "00"){
              
              guessString = guessString + "_";
            
            }else{

              let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
              guessString = guessString + web3.utils.hexToUtf8(toConvert); 

            }
          }
          
          let toRender=
            <>                       
            <p>Game ID: {id}  Bet Size: {betSize} Wei  Opponent: {opponent}</p>
            <p>{playerTurn}</p>
            <h2>{guessString}</h2>
            <p>Game: In Progress</p>
          
            <Form.Group controlID="letters">
              <Form.Control type="text" id="bytes1" placeholder="type here your lowercase letter"
                                ref={(input) => { letters = input }}
                              />                        
            </Form.Group>
            <br></br>
            <Button onClick={() =>{play(id)}} variant="dark" > Play </Button>
                         
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <Card style={{ width: '20rem' }}>
                <Card.Header><strong>Refunding: Request RNG Time Out</strong></Card.Header>
                  <Card.Body>                          
                    <Button onClick={() => rngNotFound(id)} variant="dark" > Request </Button>
                  </Card.Body>
              </Card>
            </div>

            <div  align='center' style={{display: 'flex', justifyContent: 'center'}}>
              <Card style={{ width: '20rem' }}>
                <Card.Header><strong>Request Victory: Oppent TimeOut</strong></Card.Header>                        
                  <Card.Body>
                    <Button onClick={() =>  requestWinTimeout(id)} variant="dark" > Request </Button>          
                  </Card.Body>
               </Card>
            </div>    
                             
          </>;

        arrayGames.push([id, toRender]);
        
        }else if (status == 3){
          
          if(pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
          }else{
            opponent= pOne;
            userGuess = rawPTwoGuess;
          }          
          
          let hexString = userGuess.slice(2, 2 + (wordLength*2));          
          let guessString="";
          for (let j =0; j< hexString.length; j= j+2){
            
            if (hexString[j]+ hexString[j+1]== "00"){
             
              guessString = guessString + "_";
             
            }else{
             
              let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
              guessString = guessString + web3.utils.hexToUtf8(toConvert);
              
            }
          }
                  
          let toRender=
          <>                       
            <p>Game ID: {id}  Bet Size: {betSize} Wei  Opponent: {opponent}</p>            
            <h2>{guessString}</h2>
            <p>Game: Finshed </p>
          </>;

          arrayGames.push([id, toRender]);
        
        }       
      }        
    }
    await loopGames();    
    this.setState({arrayGames:arrayGames});

    const reachebleGames = [];
    async function loopReachableGames() {

      const totalCreatedGames = await contract.methods.totalCreatedSessions().call();
      
      for(let i = 0;i <= totalCreatedGames; i++) {
        const game = await contract.methods.sessionPublic(i).call();      
        const rowArray = Object.entries(game);             
        const arrayInfoGame = rowArray.splice(9,rowArray.length);

        if (arrayInfoGame[8][1]== 1){

          const arrayToPush = arrayInfoGame[4].concat(arrayInfoGame[5],arrayInfoGame[0])
          reachebleGames.push(arrayToPush);

        }                         
      }       
    }    
    await loopReachableGames();    
    this.setState({reachebleGames:reachebleGames});
  } 
  
  rngNotFound = async(id) => {
    const { accounts, contract} = this.state;
    await contract.methods.refundRNGnotFound(id).send({from: accounts[0]});
  }

  
  openJoinSessionFct = async() => {
    const { accounts, contract} = this.state; 
      
    await contract.methods.openJoinSessionFct().send({from: accounts[0]});    
  }

  createSession = async() => {
    const { accounts, contract} = this.state; 
    const bet = this.bet.value;
    await contract.methods.createSession().send({from: accounts[0], value: bet }); 
    this.runInit();
    }
  
  joinSession = async(id,bet) => {
    const { accounts, contract} = this.state;       
    await contract.methods.joinSession(id).send({from: accounts[0], value: bet });
    this.runInit();
  }

  withdraw = async() => {
    const { accounts, contract} = this.state;       
    await contract.methods.playerWithdraw().send({from: accounts[0]});
    this.runInit();
  }

  // play = async(id) => {
  //   const { accounts, contract, web3} = this.state;
    
  //   const zeroX = this.letter.value;
  //   console.log(zeroX);
  //   const letter = web3.utils.utf8ToHex(zeroX);
  //   console.log(letter);
  //   console.log(typeof letter);    
    
  //   await contract.methods.play(letter, id).send({from: accounts[0]});
  //   this.runInit();
  // }

  addWord = async() => {
    const { accounts, contract, web3} = this.state;

    const string = this.string.value;
    console.log(string);
    const word = web3.utils.utf8ToHex(string);
    console.log(word);
    console.log(typeof word);
    await contract.methods.addWord(word).send({from: accounts[0]});
  }
  
  render() {
    // on recupere les state 
    const {arrayGames, reachebleGames, accounts, inGameBalance } = this.state;
       
    if (!this.state.web3) {

      return <div>Loading Web3, accounts, and contract...</div>;

    }

    return (

      <div className="App">
        <div>
            <h2 className="text-center">Penduel</h2>           
            <p className="text-center">connected account: {accounts}</p>                     
            <br></br>
        </div>            

        <br></br>

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Your sessions</strong></Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <Table striped bordered hover>                          
                      <tbody>
                        <tr><td> 
                          <div style={{display: 'flex', justifyContent: 'center'}}>
                            <Card style={{ width: '20rem' }}>
                              <Card.Header><strong>Create New Game</strong></Card.Header>
                                <Card.Body>
                                  <Form.Group controlID="createSession">
                                    <Form.Control type="number" id="betSize" placeholder="Bet Size in Wei"
                                        ref={(input) => { this.bet = input }}
                                      />
                                  </Form.Group>
                                    <br></br>
                                      <Button onClick={ this.createSession } variant="dark" > Create </Button>
                                </Card.Body>
                            </Card>
                          </div>  
                        </td></tr>
                          <br></br>
                        
                                          
                        {arrayGames !== null && 
                          arrayGames.map((b) =>                        
                          <tr><td>                                                     
                            <br></br>
                              {b[1]}
                            <br></br>                                                                           
                         
                          </td></tr>
                        )
                      }
                    </tbody>
                  </Table>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
           </Card>                         
        </div>
       
        <br></br>
            
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Join</strong></Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Game ID // Bet Size  // Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reachebleGames !== null && 
                        reachebleGames.map((a) => <><tr><td>
                          
                          Game ID: {a[1]}  Bet Size: {a[3]} wei Created By: {a[5]}
                          <br></br>
                          <br></br>
                          <Button onClick={() => {this.joinSession(a[1],a[3])}} variant="dark" > join </Button>
                          </td></tr>
                          <br></br>
                          </>                        
                        )
                      }                     
                    </tbody>
                  </Table>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </div>

        <br></br>

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>In-Game Balance: {inGameBalance} wei</strong></Card.Header>
            <Card.Body>          
              <Button onClick={ this.withdraw } variant="dark" > withdraw </Button>
            </Card.Body>
          </Card>
        </div>

        <br></br>

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>(Only Admin)</strong> </Card.Header>           
            <Card.Body>  
            <br></br>
            <Button onClick={ this.openJoinSessionFct} variant="dark" > openJoinSessionFct() </Button>
            <br></br>
            <Form.Group controlId="createSession">
                <br></br>
                <Form.Control type="text" id="uintVote" placeholder="word"
                ref={(input) => { this.string= input }}              
                />
              </Form.Group>
              <br></br>
              <Button onClick={ this.addWord } variant="dark" > Add Word </Button>             
              <br></br>
            </Card.Body>
          </Card>
        </div>

        <br></br> 

      </div>

    );
  }
}

export default App;