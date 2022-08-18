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
  
  state = { web3: null, accounts: null, contract: null, playerGames: null, arrayGames: null, reachebleGames: null, inGameBalance: null, owner:null};
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
    const { contract, accounts, web3} = this.state; 
    const owner = '0x8014Dd2b5f8a6513A7c4116D961cb5872F4bcA1b'; 
    this.setState({owner: owner}); 

    const inGameBalance = await contract.methods.balance(accounts[0]).call();    
    this.setState({ inGameBalance: inGameBalance });    

    // récupérer la listes des parties du joueur connecté
    const playerGames = await contract.methods.getPlayerGames(accounts[0]).call(); 
    console.log(playerGames);   
    this.setState({ playerGames: playerGames });

    const rngNotFound = async(id) => {
      const { accounts, contract} = this.state;
      await contract.methods.refundRNGnotFound(id).send({from: accounts[0]});
    }

    
    
    // a modifié pour que l'input soit dans le scop
    const play = async(letter, id) => {
      const { accounts, contract} = this.state;          
      console.log(letter);      
      console.log(typeof letter);
      await contract.methods.play(letter, id).send({from: accounts[0]});
      this.runInit();
    }

    const requestWinTimeout = async(id) => {
      const { accounts, contract} = this.state;
      await contract.methods.requestWinTimeout(id).send({from: accounts[0]});
    }

    const cancelGame = async(id) => {
      const { accounts, contract} = this.state;       
      await contract.methods.requestCancelGame(id).send({from: accounts[0]});
      this.runInit();
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
        let textEndgame;
        let toRender;
        let index;
        let renderRNGButton;
        
        // création du rendu selon l'etat de la partie
        // si la partie est joigable
        if(status == 1) {
        
          index = 0;  
          toRender =
          <>  <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card>
                  <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei Created By: You</Card.Header>                       
                    <Card.Body>                      
                      <h5>Await for a Second Player</h5>
                      <div  align='center' style={{display: 'flex', justifyContent: 'center'}}>
                        <Card style={{ width: '20rem' }}>
                          <Card.Header><strong>Cancel the game</strong></Card.Header>                        
                            <Card.Body>
                              <Button onClick={() =>  cancelGame(id)} variant="dark" > Cancel </Button>          
                            </Card.Body>
                        </Card>
                      </div>  
                  </Card.Body>
                </Card>
              </div>                     
          </>;

          arrayGames.push([index, id, toRender]);
         
        // si la partie est en cours  
        }else if(status == 2) {
          
          index = 1;
          if(pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;           
          }else{
            opponent= pOne;
            userGuess = rawPTwoGuess;
          }

          if (wordLength == 0) {
            renderRNGButton=
            <>
              <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card style={{ width: '20rem' }}>
                  <Card.Header><strong>Refunding: Request RNG Time Out</strong></Card.Header>
                    <Card.Body>                          
                      <Button onClick={() => rngNotFound(id)} variant="dark" > Request </Button>
                    </Card.Body>
                </Card>
              </div>
            </>;
          }
          
          // ici on convertie le mot du joueur de bytes32 à utf8 
          let hexString = userGuess.slice(2, 2 + (wordLength*2));          
          let guessString="";
          for (let j=0; j< hexString.length; j= j+2){
            
            if (hexString[j]+ hexString[j+1]== "00"){
              
              guessString = guessString + " _ ";
            
            }else{

              let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
              guessString = guessString + web3.utils.hexToUtf8(toConvert).toUpperCase(); 

            }
          }

          if(mustPlay == accounts[0]) {

            playerTurn = 'Your Turn';
            toRender=
              <> <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card>
                  <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei  Opponent: {opponent}</Card.Header>                       
                    <Card.Body>                                   
                      <p>{playerTurn}</p>
                      <p>your guess:  <h1>{guessString}</h1></p>
                      <p>Game: In Progress</p>          
                    <br></br>
                      <p>{renderRNGButton}</p>
           
                <div style={{display: 'flex', justifyContent: 'center'}}>
                  <Card style={{ width: '20rem' }}>
                    <Card.Header><strong>Play</strong></Card.Header>
                      <Card.Body >                          
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x61', id)}} variant="dark" >A</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x62', id)}} variant="dark" >B</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x63', id)}} variant="dark" >C</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x64', id)}} variant="dark" >D</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x65', id)}} variant="dark" >E</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x66', id)}} variant="dark" >F</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x67', id)}} variant="dark" >G</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x68', id)}} variant="dark" >H</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x69', id)}} variant="dark" >I</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x6a', id)}} variant="dark" >J</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x6b', id)}} variant="dark" >K</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x6c', id)}} variant="dark" >L</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x6d', id)}} variant="dark" >M</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x6e', id)}} variant="dark" >N</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x6f', id)}} variant="dark" >O</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x70', id)}} variant="dark" >P</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x71', id)}} variant="dark" >Q</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x72', id)}} variant="dark" >R</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x73', id)}} variant="dark" >S</Button>                  
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x74', id)}} variant="dark" >T</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x75', id)}} variant="dark" >U</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x76', id)}} variant="dark" >V</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x77', id)}} variant="dark" >W</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x78', id)}} variant="dark" >X</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x79', id)}} variant="dark" >Y</Button>
                        <Button style={{ margin: '1px'}} onClick={() =>{play('0x7a', id)}} variant="dark" >Z</Button>      
                      </Card.Body>
                    </Card>
                </div>
                </Card.Body>
                </Card>
              </div>  
          </>;


          }else{
            playerTurn = 'Await your turn';
            toRender=
              <> 
              <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card>
                  <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei  Opponent: {opponent}</Card.Header>                       
                    <Card.Body>                
                      <p>{playerTurn}</p>
                      <p>your guess:  <h1>{guessString}</h1></p>
                      <p>Game: In Progress</p> 
                      <p>{renderRNGButton}</p>        
          
                <br></br>
                <div  align='center' style={{display: 'flex', justifyContent: 'center'}}>
                  <Card style={{ width: '20rem' }}>
                    <Card.Header><strong>Request Victory: Oppent TimeOut</strong></Card.Header>                        
                      <Card.Body>
                        <Button onClick={() =>  requestWinTimeout(id)} variant="dark" > Request </Button>          
                    </Card.Body>
                  </Card>
                </div>
                </Card.Body>
                </Card>
              </div>    
            </>
          }


          
          
          

        arrayGames.push([index, id, toRender]);
        
        // Player One Win
        }else if (status == 3){
          
          index = 2;
          if(pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
            textEndgame = `Victory!! ${betSize*2} Wei have been credited to your in-game balance `; 
          }else{
            opponent= pOne;
            userGuess = rawPTwoGuess;
            textEndgame = `Defeat`;
          }          
          
          let hexString = userGuess.slice(2, 2 + (wordLength*2));          
          let guessString="";
          for (let j =0; j< hexString.length; j= j+2){
            
            if (hexString[j]+ hexString[j+1]== "00"){
             
              guessString = guessString + " _ ";
             
            }else{
             
              let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
              guessString = guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
              
            }
          }
                  
          let toRender=
          <> 
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card>
                  <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei  VS: {opponent}</Card.Header>                       
                    <Card.Body>                                   
                  
            <p>your guess:  <h1>{guessString}</h1></p>
            <h5>{textEndgame}</h5>
            </Card.Body>
                </Card>
              </div>
          </>;

          arrayGames.push([index, id, toRender]);
        
         
        // Player two Win
        }else if (status == 4){
          index = 2;
          if(pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;
            textEndgame = `Defeat`;          
          }else{
            opponent= pOne;
            userGuess = rawPTwoGuess;
            textEndgame = `Victory!! ${betSize*2} Wei have been credited to your in-game balance `; 
          }          
        
          let hexString = userGuess.slice(2, 2 + (wordLength*2));          
          let guessString="";
          for (let j =0; j< hexString.length; j= j+2){
          
            if (hexString[j]+ hexString[j+1]== "00"){
           
              guessString = guessString + " _ ";
           
            }else{
           
              let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
              guessString = guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            
            }
          }
                
          let toRender=
          <><div style={{display: 'flex', justifyContent: 'center'}}>
          <Card>
            <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei  VS: {opponent}</Card.Header>                       
              <Card.Body>                       
             
                      
            <p>your guess:  <h1>{guessString}</h1></p>
            <h5>{textEndgame}</h5>
            </Card.Body>
                </Card>
              </div>
          </>;

          arrayGames.push([index, id, toRender]);
      
        // Draw
        }else if (status == 5){
          
          index = 2;
          if(pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;         
          
          }else{
            opponent= pOne;
            userGuess = rawPTwoGuess;
          }          
        
          textEndgame = `Draw! ${betSize} Wei have been credited to your in-game balance `; 
          let hexString = userGuess.slice(2, 2 + (wordLength*2));          
          let guessString="";
          for (let j =0; j< hexString.length; j= j+2){
          
            if (hexString[j]+ hexString[j+1]== "00"){
           
              guessString = guessString + " _ ";
           
            }else{
           
              let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
              guessString = guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            
            } 
          }
                
          let toRender=
            <>  
                <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card>
                  <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei  VS: {opponent}</Card.Header>                       
                    <Card.Body>                 
               
                      
              <p>your guess:  <h1>{guessString}</h1></p>
              <h5>{textEndgame}</h5>
              </Card.Body>
                </Card>
              </div>
            </>;

          arrayGames.push([index, id, toRender]);
      
      // Cancelled by creator of the game  
      } else if (status == 6){       
        
        index = 3;
        textEndgame = `Game Cancelled! ${betSize} Wei have been credited to your in-game balance `;       
                        
        let toRender=
        <>  <div style={{display: 'flex', justifyContent: 'center'}}>
        <Card>
          <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei</Card.Header>                       
            <Card.Body>                                                             
          <h5>{textEndgame}</h5>
          </Card.Body>
                </Card>
              </div>
        </>;

        arrayGames.push([index, id, toRender]); 

      // Player One Win by TimeOut
      }else if (status == 7){
        
        index = 2;
        if(pOne == accounts[0]) {
          opponent = pTwo;
          userGuess = rawPOneGuess;         
          textEndgame = `Victory by TimeOut! ${betSize*2} Wei have been credited to your in-game balance `;             
        }else{
          opponent= pOne;
          userGuess = rawPTwoGuess;
          textEndgame = `Defeat! More than 24 hours have passed since\n your opponent's last move, he has requested a TimeOut Victory `;
        }          
          
        let hexString = userGuess.slice(2, 2 + (wordLength*2));          
        let guessString="";
        for (let j =0; j< hexString.length; j= j+2){
          
          if (hexString[j]+ hexString[j+1]== "00"){
           
            guessString = guessString + " _ ";
            
          }else{
             
            let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
            guessString = guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
            
          }
        }
                  
        let toRender=
          <>   <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card>
            <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei  VS: {opponent}</Card.Header>                       
              <Card.Body>                                 
                  
            <p>your guess:  <h1>{guessString}</h1></p>
            <h5>{textEndgame}</h5>
            </Card.Body>
                </Card>
              </div>
          </>;
  
        arrayGames.push([index, id, toRender]);  

        // Player Two Win by Timeout
        }else if (status == 8){
          
          index = 2;
          if(pOne == accounts[0]) {
            opponent = pTwo;
            userGuess = rawPOneGuess;         
            textEndgame = `Defeat! More than 24 hours have passed since\n your opponent's last move, he has requested a TimeOut Victory `;
          }else{
            opponent= pOne;
            userGuess = rawPTwoGuess;
            textEndgame = `Victory by TimeOut! ${betSize*2} Wei have been credited to your in-game balance `;             
          }          
            
          let hexString = userGuess.slice(2, 2 + (wordLength*2));          
          let guessString="";
          for (let j =0; j< hexString.length; j= j+2){
            
            if (hexString[j]+ hexString[j+1]== "00"){
             
              guessString = guessString + " _ ";
              
            }else{
               
              let toConvert = `0x${hexString[j]}${hexString[j+1]}00000000000000000000000000000000000000000000000000000000000000`;             
              guessString = guessString + web3.utils.hexToUtf8(toConvert).toUpperCase();
              
            }
          }
                    
          let toRender=
            <>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <Card>
                  <Card.Header>Game ID: {id}  Bet Size: {betSize} Wei  VS: {opponent}</Card.Header>                       
                    <Card.Body>                       
           
                        
              <p>your guess:  <h1>{guessString}</h1></p>
              <h5>{textEndgame}</h5>
              </Card.Body>
                </Card>
              </div>
            </>;
    
          arrayGames.push([index, id, toRender]);  
          }
      }          
    }
    await loopGames();
    console.log(arrayGames);
    arrayGames.sort();    
    console.log(arrayGames);
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

  
  withdraw = async() => {
    const { accounts, contract} = this.state;       
    await contract.methods.playerWithdraw().send({from: accounts[0]});
    this.runInit();
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

  pausedJoinSessionFct = async() => {
    const { accounts, contract} = this.state;       
    await contract.methods.pausedJoinSessionFct().send({from: accounts[0]});
    this.runInit();
  }

  openJoinSessionFct = async() => {
    const { accounts, contract} = this.state;       
    await contract.methods.openJoinSessionFct().send({from: accounts[0]});
    this.runInit();
  }  

  addWord = async() => {
    const { accounts, contract, web3} = this.state;

    const string = this.string.value;
    console.log(string);
    const lowerString = string.toLowerCase();
    console.log(lowerString)
    const word = web3.utils.utf8ToHex(lowerString);
    console.log(word);
    console.log(typeof word);
    await contract.methods.addWord(word).send({from: accounts[0]});
  }
  
  render() {
    // on recupere les state 
    const {arrayGames, reachebleGames, accounts, inGameBalance, owner } = this.state;
       
    if (!this.state.web3) {

      return <div>Loading Web3, accounts, and contract...</div>;

    }

    return (

      <div className="App">
        <div style={{display: 'inline­-flex',  margin: '7px', justifyContent: 'spaceBetween'}}>
            <div></div>
            <div><h2 className="text-center">Penduel</h2></div>                   
            <div><Button variant="dark">{accounts}</Button></div>  
            <br></br>
        </div>            
            <hr></hr>                   

        <br></br>

        <div style={{display: 'flex',justifyContent:'center'}}>
          <Card style={{display: 'flex', flexDirection:'column'}}>
            <Card.Header><strong>Your sessions</strong></Card.Header>
              <Card.Body>                                     
                      <tbody>
                        <tr><td> 
                          <div style={{display: 'flex', justifyContent:'center' }}>
                            <Card style={{ width: '23rem',alignContent:'center' }}>
                              <Card.Header><strong>Create New Game</strong></Card.Header>
                                <Card.Body>
                                  <Form.Group id="createSession">
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
                          <div>                                                                               
                              {b[2]}
                            <br></br>                         
                          </div>
                        )
                      }
                    </tbody>
                
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

        {accounts[0] == owner ? <>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Card style={{ width: '50rem' }}>
              <Card.Header><strong>(Only Admin)</strong> </Card.Header>           
                <Card.Body>  
                  <br></br>
                    <Button  style={{ margin: '3px'}}onClick={ this.openJoinSessionFct} variant="dark" > openJoinSessionFct() </Button>
                  <br></br>
                    <Button onClick={ this.pausedJoinSessionFct} variant="dark" > pausedJoinSessionFct() </Button>
                  <br></br>
                    <Form.Group id="createSession">
                      <br></br>
                      <Form.Control type="text" id="uintVote" placeholder="word"
                        ref={(input) => { this.string= input }}              
                      />
                    </Form.Group>
                      <br></br>
                    <Button  style={{ margin: '3px'}}onClick={ this.addWord } variant="dark" > Add Word </Button>             
                      <br></br>
                </Card.Body>
            </Card>
          </div>
          </>
            :<></> 
        }
      <br></br> 
    </div>
    );
  }
}

export default App;