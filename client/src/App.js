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
  // state = { web3: null, accounts: null, contract: null, arrayproposal: null, whitelist: null};
  state = { web3: null, accounts: null, contract: null, playerGames: null, reachableSessions: null, playerGuess:null, victory:null, balance:null, mustPlay:null};
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
     const playerGamesIDs = await contract.methods.getPlayerGames(accounts[0]).call();
    // Mettre à jour le state 
     const playerGames = playerGamesIDs.map((el) =>  {
       console.log(el);
       contract.methods.sessionPublic(el).call();
     })
    const test = await contract.methods.sessionPublic(1).call();
    console.log(test.betSize);
    this.setState({ playerGames: playerGames });
    //console.log(playerGames[0])
    //console.log(playerGames);
   
    //let gamerSessions = await contract.methods.session(1).call();
    //console.log(gamerSessions);


    // récupérer la liste des parties joignable
    //const reachableSessions = await contract.methods.getReachableSessions().call();
    // Mettre à jour le state  
    //this.setState({ reachableSessions: reachableSessions });

    

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
  
  joinSession = async() => {
    const { accounts, contract} = this.state;
    const idSession = this.address.value;
    const inputValue = this.address.value;
    await contract.methods.joinSession(idSession).send({from: accounts[0], value: inputValue });
  }

  play = async() => {
    const { accounts, contract} = this.state;
    
    const letter = this.address.value;
    const idSession = this.address.value;
    await contract.methods.play(letter, idSession).send({from: accounts[0]});
  }

//   getarray = async() => {
//     const { accounts, contract} = this.state;
//     const proposal = this.proposal.value;
   
//     await contract.methods.depositProposal(proposal).send({from: accounts[0]});
//     // Récupérer la liste des comptes autorisés
//     this.runInit();
//   }

//   endproposal = async() => {
//     const { accounts, contract} = this.state;    
//     await contract.methods.endProposalRegistration().send({from: accounts[0]});
    
//   }

//   startvote = async() => {
//     const { accounts, contract} = this.state;    
//     await contract.methods.startVotingSession().send({from: accounts[0]});
    
//   }

//   votefor = async() => {
//     const { accounts, contract} = this.state;  
//     const vote = this.vote.value;  
//     await contract.methods.voteFor(vote).send({from: accounts[0]});
//     this.runInit();
//   }

//   stopvote = async() => {
//     const { accounts, contract} = this.state;    
//     await contract.methods.endVotingSession().send({from: accounts[0]});
//   }

//   countedtailes = async() => {
//     const { accounts, contract} = this.state;
//     await contract.methods.countedVotes().send({from: accounts[0]});
//     this.runInit();
//     this.runGetwinner();
//   }
    

//   winnerid = async() => {
//     const {contract} = this.state;
//     await contract.methods.getWinner().call();
//     this.runInit();
//   }
 

  render() {
    // on recupere les state 
    const {playerGames, reachableSessions, gameID } = this.state;

    // pour visualiser l'uint ID des propositions

    
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div>
            <h2 className="text-center">Penduel</h2>
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
                    <tbody>
                  
                      {playerGames !== null && 
                        playerGames.map((b) => 
                        
                        <tr><td>
                          <br></br>
                          {b}
                        

                          <Form.Group controlID="playSession">
                          <Form.Control type="text" id="letter" placeholder="type here your lowercase letter"
                          ref={(input) => { this.letter = input }}
                        />
                        
                        <br></br>
                      </Form.Group><Button onClick={this.play } variant="dark" > Play </Button></td></tr>)
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
                      {reachableSessions !== null && 
                        reachableSessions.map((a) => <tr><td>#: {gameID} / {a[0]} / {a[1]}</td></tr>)
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