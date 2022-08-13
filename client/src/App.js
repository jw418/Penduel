import React, { Component } from "react";
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
  
  state = { web3: null, accounts: null, contract: null, playerGames: null, arrayGames: null, reachebleGames: null, playerOneGuess:null,playerTwoGuess:null, victory:null, balance:null, mustPlay:null};
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
    const { contract, accounts } = this.state;    
    

    // récupérer la listes des parties du joueur connecté
    const playerGames = await contract.methods.getPlayerGames(accounts[0]).call();
    console.log(playerGames);
    this.setState({ playerGames: playerGames });

    const arrayGames = [];
    async function loopGames() {
      for(let i = 0;i < playerGames.length; i++) {
        const game = await contract.methods.sessionPublic(playerGames[i]).call();
        console.log(game)
        const rowArray = Object.entries(game);
        console.log(rowArray);
        const arrayGame = rowArray.splice(9,rowArray.length);
        //if (arrayGame[8][1]== 1){
        //  const arrayToPush = arrayGame[4].concat(arrayGame[5],arrayGame[0])
        //  arrayGames.push(arrayToPush);
        //} else {
        console.log(arrayGame);      
        arrayGames.push(arrayGame);
       // }
      }    
      
    }    
    await loopGames();  
    this.setState({arrayGames:arrayGames});

    const reachebleGames = [];
    async function loopReachableGames() {
      const totalCreatedGames = await contract.methods.totalCreatedSessions().call();
      console.log(String(totalCreatedGames));
      for(let i = 0;i <= totalCreatedGames; i++) {
        const game = await contract.methods.sessionPublic(i).call();      
        const rowArray = Object.entries(game);             
        const arrayInfoGame = rowArray.splice(9,rowArray.length);
        if (arrayInfoGame[8][1]== 1){
          const arrayToPush = arrayInfoGame[4].concat(arrayInfoGame[5],arrayInfoGame[0])
          reachebleGames.push(arrayToPush);
        } 
        console.log(arrayInfoGame[8][1]);
        console.log(arrayInfoGame[4]);
        console.log(arrayInfoGame[5]);   
        console.log(arrayInfoGame[0]);                   
      }       
    }    
    await loopReachableGames();  
    console.log(reachebleGames);
    this.setState({reachebleGames:reachebleGames});
  }

  
  runGetwinner = async() => {
    const { contract } = this.state;
    // récupérer la liste des comptes autorisés
    const winnerid = await contract.methods.getWinner().call();
    // Mettre à jour le state 
    this.setState({ winnerid : winnerid });
  }; 


  //###########################
  //################ simple fct
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
  }

  play = async() => {
    const { accounts, contract} = this.state;
    
    const letter = this.address.value;
    const idSession = this.address.value;
    await contract.methods.play(letter, idSession).send({from: accounts[0]});
  }


  render() {
    // on recupere les state 
    const {arrayGames, reachebleGames, accounts,gameID } = this.state;

    // pour visualiser l'uint ID des propositions

    
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div>
            <h2 className="text-center">Penduel</h2>
           
            <p className="text-right">connected account: {accounts}</p>
            <h1></h1>
            <hr></hr>
            <br></br>
        </div>        

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Your sessions</strong></Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Table striped bordered hover>                                 
                          <script>console.log(arrayGames);</script> 
                    <tbody>                  
                      {arrayGames !== null && 
                        arrayGames.map((b) => 
                        
                        <tr><td>
                          <br></br>
                          {b[4][0]}: {b[4][1]}
                          <br></br>
                          {b[0][0]}: {b[0][1]}
                          <br></br>
                          {b[1][0]}: {b[1][1]}
                          <br></br>
                          {b[2][0]}: {b[2][1]}                         
                          <br></br>
                          {b[5][0]}: {b[5][1]} wei
                          <br></br>
                          {b[6][0]}: {b[6][1]}
                          <br></br>    
                          {b[7][0]}: {b[7][1]}
                          <br></br>
                          {b[8][0]}: {b[8][1]}
                          <br></br>                                                                            
                          <Form.Group controlID="playSession">
                          <Form.Control type="text" id="letter" placeholder="type here your lowercase letter"
                          ref={(input) => { this.letter = input }}
                          />
                        
                        <br></br>
                        </Form.Group><Button onClick={this.play} variant="dark" > Play </Button></td></tr>)
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
            <Card.Header><strong>Create new Session ++</strong></Card.Header>
            <Card.Body>
              <Form.Group controlID="createSession">
                <Form.Control type="number" id="betSize" placeholder="Bet Size amount in wei"
                ref={(input) => { this.bet = input }}
                />
              </Form.Group>
              <br></br>
              <Button onClick={ this.createSession } variant="dark" > Create </Button>
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
                          <Button onClick={this.joinSession(a[1],a[3])} variant="dark" > join </Button>
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
            <Card.Header><strong>(Only Admin)</strong> </Card.Header>           
            <Card.Body>  
            <br></br>
            <Button onClick={ this.openJoinSessionFct} variant="dark" > openJoinSessionFct() </Button>
            <br></br>
            <Form.Group controlId="createSession">
                <br></br>
                <Form.Control type="text" id="uintVote" placeholder="word"
                ref={(input) => { this.addWord= input }}
                />
              </Form.Group>
              <br></br>
              <Button onClick={ this.addWord} variant="dark" > Add Word </Button>             
              <br></br>
            </Card.Body>
          </Card>
          </div>
        <br></br>

        

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>withdraw</strong></Card.Header>
            <Card.Body>          
              <Button onClick={ this.playerWithdraw } variant="dark" > withdraw </Button>
            </Card.Body>
          </Card>
          </div>
        <br></br>
      
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Refunding: Request RNG Time Out</strong></Card.Header>
            <Card.Body>          
              <Button onClick={ this.refundRNGnotFound} variant="dark" > Request </Button>
            </Card.Body>
          </Card>
          </div>
        <br></br>

        <div  align='center' style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Request Victory: Oppent TimeOut</strong></Card.Header>                        
            <Card.Body>
            <Button onClick={ this.requestWinTimeout} variant="dark" > Request </Button>          
            </Card.Body>
          </Card>
          </div>
        <br></br>      

      </div>

    );
  }
}

export default App;