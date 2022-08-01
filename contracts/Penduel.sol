/// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";


/// @title Penduel
/// @author jw418
/// @notice Versus hangman's game 
/// @dev This contract can cointains exploit, deploy this contract on tesnet only!!
contract Penduel is VRFConsumerBaseV2{
    VRFCoordinatorV2Interface COORDINATOR;

    /* Chainlink's VRF V2  variables */
    bool joinSessionFctOpen;
    uint16 requestConfirmations = 3;        // The default is 3, but you can set this higher.
    uint32 callbackGasLimit = 100000;
    uint32 numWords =  1;                   // Number of random number at each request.
    uint64  public s_subscriptionId;                // Your subscription ID for CHAINLINK   // 8023  
    uint256[] public s_randomWords;         // For the FullFill Fct                   
    address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;   // Rinkeby coordinator 30 gwei Key Hash
    bytes32 s_keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc; // 30 gwei Key Hash
    AggregatorV3Interface ethUsdPriceFeed;
      

    
    uint timeOut = 24 hours;     
    bytes32[] _words = [
        bytes32("hello"),bytes32("goodbye"),bytes32("sun"),
        bytes32("holliday"),bytes32("before"),bytes32("after"),
        bytes32("special")
    ];      
    uint256 public totalCreatedSessions;
      
    address payable public admin; 
    Sessions[] games;

    /* Mapping*/
    mapping(uint256 => uint256) private reqId;                  //  associate a request with a game session
    mapping(uint256 => Sessions) private session;               //  mapping an uint(idSession) with a session    
    mapping(address => uint256) public balance;                 //  gamers balances
    mapping(address => Player) playerGames;                     //  attached a gamer addres with his sessions
    
    struct Sessions {
        bool playerOneFoundWord;
        bool playerTwoFoundWord;
        bool firstLetterRemplaced;
        uint8 wordLegth;
        uint256 idSession;   
        uint256 betSize;
        uint rngRequestDate; 
        uint lastMoveDate;                         
        bytes32 word;        
        bytes32 playerOneGuess;
        bytes32 playerTwoGuess;
        address payable playerOne;
        address payable playerTwo;
        address mustPlay;   
        StateSession  state;
    }

    struct Player{
        uint256[] games;

    }

    struct ReachableSession{
        uint256 idSession;
        uint256 betSize;
        address playerOne;
    }

    //ReachableSessions[] public reachableSession;

    enum StateSession {
        NotCreated,
        Reachable,
        InProgress,
        Finished
    } 

    modifier onlyAdmin() {
        require(msg.sender == admin, "caller is not the admin");
        _;
    }

    modifier onlyPlayer(uint256 idSession) {
        require(msg.sender == session[idSession].mustPlay, "is not your turn");
        _;
    }

    /* Events */
    event Withdraw(address admin, uint256 amount);
    event Received(address indexed sender, uint256 amount);
    event SessionCreated(uint idSession, address playerOne, uint256 betSize);
    event SessionJoined(uint idSession, address playerTwo);
    event RNGRequested(uint256 indexed requestId, uint256 indexed idSession);
    event RNGFound(uint256 indexed requestId);

    event RandomWordsTaken(uint256[] randomWords);


  /* Constructor*/
    /// @dev go to your chainlink account to see your subcription ID 
    /// @dev when the contract is deployed do not forget to add this contract to your consumer
    constructor(uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {    
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        admin = payable(msg.sender);
        s_subscriptionId = subscriptionId;
    }

    /* Allows this contract to receive payments */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }    

    /// @notice a withdraw function for players
    function playerWithdraw() external {  
        uint toSend = balance[msg.sender];
        balance[msg.sender]=0;
		msg.sender.call{ value: toSend }("");             
    }

    /// @param idSession uint256 for identify the session
    /// @notice if chainlink took too many times for given a rng the player can ask for a refund 
    function refundRNGnotFound(uint256 idSession) public {
        require(msg.sender == session[idSession].playerOne || msg.sender == session[idSession].playerTwo, "Error, Not your session");
        require(session[idSession].word[0] != "","Error, RNG word already found");
        require(block.timestamp > (session[idSession].rngRequestDate + 3 hours), "Error, TimeOut Not Reached");        
        session[idSession].state = StateSession.Finished;
        balance[session[idSession].playerOne] += session[idSession].betSize;
        balance[session[idSession].playerTwo] += session[idSession].betSize;
    }

    /// @param idSession uint256 for identify the session
    /// @notice if the opponent player took too many times for playing you can ask for a win by TimeOut
    function requestWinTimeout(uint256 idSession) public {
        require(block.timestamp > (timeOut + session[idSession].lastMoveDate), "Error, TimeOut Not Reached");
        require(msg.sender == session[idSession].playerOne || msg.sender == session[idSession].playerTwo, "Error, Not your session");
        require(session[idSession].state == StateSession.InProgress,"Error, session is not in progress");

        if(session[idSession].mustPlay == session[idSession].playerTwo && msg.sender == session[idSession].playerOne) {
            session[idSession].state = StateSession.Finished;
            balance[session[idSession].playerOne] += session[idSession].betSize*2;
        }
        if(session[idSession].mustPlay == session[idSession].playerOne && msg.sender == session[idSession].playerTwo) {
            session[idSession].state = StateSession.Finished;
            balance[session[idSession].playerTwo] += session[idSession].betSize*2;
        }
    }

    /// @param word it is a bytes32
    /// @notice allows the owner to add words to the list for the game
    function addWord(bytes32 word) external onlyAdmin {
        _words.push(word);  
    }  

    /// @dev first make sure that the contract has been added to the consumers on your chainlik subscription management page
    /// @notice autorised players to use the joinSession Function     
    function openJoinSessionFct() external onlyAdmin {
        joinSessionFctOpen = true;  
    }    
   
    /// @notice for create a new game session
    function createSession() payable public {
        require(msg.sender.balance>=msg.value, 'Error, insufficent vault balance');
        require(msg.value > 0, 'Error, minimum 1 WEI');
        totalCreatedSessions++;
        playerGames[msg.sender].games.push(totalCreatedSessions);
        session[totalCreatedSessions].playerOne = payable(msg.sender); 
        session[totalCreatedSessions].idSession = totalCreatedSessions;
        session[totalCreatedSessions].playerOne = payable(msg.sender);
        session[totalCreatedSessions].betSize = msg.value;        
        session[totalCreatedSessions].state = StateSession.Reachable;
        // reachableSession[totalCreatedSessions].idSession = totalCreatedSessions;
        // reachableSession[totalCreatedSessions].betSize = msg.value;
        // reachableSession[totalCreatedSessions].playerOne = msg.sender;

        emit SessionCreated(totalCreatedSessions, msg.sender, msg.value);
    }

    /// @dev this function request for randomness
    /// @notice for join a session already created
    function joinSession(uint256 idSession) payable public returns (uint256 requestId){
        require(joinSessionFctOpen == true, 'Error, past RNG requet not already found, please try later');
        require(msg.sender != session[idSession].playerOne, 'Error, your are already in this session');
        require(msg.sender.balance >= msg.value, 'Error, insufficent vault balance');
        require(msg.value >= session[idSession].betSize, 'Error, insufficent vault balance');
        require(session[idSession].state == StateSession.Reachable, 'Error, session already full, finished or does not exsist');     
        
        session[idSession].playerTwo = payable(msg.sender);
        joinSessionFctOpen = false;
        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        reqId[requestId] = session[idSession].idSession;         // here we mapping request id with a session       
        emit RNGRequested(requestId, idSession);
        session[idSession].rngRequestDate = block.timestamp;        
        session[idSession].mustPlay = session[idSession].playerTwo;
        playerGames[msg.sender].games.push(totalCreatedSessions);
        emit SessionJoined(idSession, msg.sender);
    }

    /// @param requestId uint256 for identify the rng request
    /// @param randomWords is a mandatory arry for this chainlink function
    /// @dev The fulfillRandomWords function must not revert
    /// @notice this function is call by the vrf coordinator and permit to attribute a rng word to the session
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal  override{
        uint256 value = randomWords[0] % _words.length;
        session[reqId[requestId]].word = _words[value]; 
        // emitting event to signal rng was founded
        emit RNGFound(requestId);
        emit RandomWordsTaken(randomWords);        
        joinSessionFctOpen = true;

        // here we remplaced the first letter     
        if(session[reqId[requestId]].firstLetterRemplaced == false){
            compareAndCopy(session[reqId[requestId]].word, session[reqId[requestId]].word[0], reqId[requestId]);
            session[reqId[requestId]].firstLetterRemplaced = true;
        }
        session[reqId[requestId]].lastMoveDate = block.timestamp;   // start timeout counter
        session[reqId[requestId]].state = StateSession.InProgress;  // rng was founded so we can open the session       
    }    

    /// @param idSession uint256 for identify the session
    /// @param letter played in bytes1      
    /// @notice the playing function of this dapp
    function play(bytes1 letter, uint256 idSession) public  onlyPlayer(idSession) {        
        require(isLetter(letter) == true, "Error, only lowercase letter accepted"); 
        require(session[idSession].state == StateSession.InProgress,"Error, this game session is not in progress");
        require(session[idSession].playerTwo != address(0x0), "Error, await for a second player");
        require(session[idSession].word[0] != "", "RNG word not already found, please wait");      
      
        // when Player One plays
        if (msg.sender == session[idSession].playerOne) {             
            compareAndCopy(session[idSession].word, letter, idSession);            
            session[idSession].mustPlay = session[idSession].playerTwo;
            session[idSession].lastMoveDate = block.timestamp;
           
            // Player one Find the word
            if(session[idSession].word == session[idSession].playerOneGuess) {
                session[idSession].playerOneFoundWord = true;

                // Draw
                if(session[idSession].playerTwoFoundWord == true){
                    session[idSession].state = StateSession.Finished;
                    balance[session[idSession].playerOne] += session[idSession].betSize;
                    balance[session[idSession].playerTwo] += session[idSession].betSize;
                }
                
                // Player one Win
                if(session[idSession].playerTwoFoundWord == false) {                
                session[idSession].state = StateSession.Finished;
                balance[session[idSession].playerOne] += session[idSession].betSize*2;
                }
            } 

            // Player Two Win: Player Two find the word and player not found it
            if(session[idSession].playerTwoFoundWord == true && (session[idSession].playerOneFoundWord == false)){
                session[idSession].state = StateSession.Finished;
                balance[session[idSession].playerTwo] += session[idSession].betSize*2;
            }

        }

         // when Player One plays
        if (msg.sender == session[idSession].playerTwo){
            compareAndCopy(session[idSession].word, letter, idSession);            
            session[idSession].mustPlay = session[idSession].playerOne;
            session[idSession].lastMoveDate = block.timestamp;

            // Player Two find the world 
            if(session[idSession].word == session[idSession].playerTwoGuess) {
                session[idSession].playerTwoFoundWord = true;
            } 
        }        
    }

    /// @param position of the letter to change
    /// @param toInsert letter to copy in bytes1 
    /// @param idSession uint256 for identify the session 
    /// @notice replaceBytesAtIndex
    function replaceBytesAtIndex(uint8 position, bytes1 toInsert, uint256 idSession) public {
        bytes1 maskBytes = 0xff;
        bytes32 mask = bytes32(maskBytes) >> (position * 8);

        if(session[idSession].firstLetterRemplaced == false){
            session[idSession].playerOneGuess = (~mask & session[idSession].playerOneGuess) | (bytes32(toInsert) >> (position * 8));
            session[idSession].playerTwoGuess = (~mask & session[idSession].playerTwoGuess) | (bytes32(toInsert) >> (position * 8));
        }  
            
        if(session[idSession].mustPlay == session[idSession].playerOne && session[idSession].firstLetterRemplaced == true){
            session[idSession].playerOneGuess = (~mask & session[idSession].playerOneGuess) | (bytes32(toInsert) >> (position * 8));         
        }
        if(session[idSession].mustPlay == session[idSession].playerTwo && session[idSession].firstLetterRemplaced == true){
           session[idSession].playerTwoGuess = (~mask & session[idSession].playerTwoGuess) | (bytes32(toInsert) >> (position * 8));
        }        
    }

    /// @param word to compare
    /// @param letter to check 
    /// @param idSession uint256 for identify the session 
    /// @notice compare and copy identical letter  
    function compareAndCopy(bytes32 word, bytes1 letter, uint256 idSession) public{
        for(uint8 i=0; i < 32 && word[i] != 0; i++){
            if(word[i] == letter) {                
                replaceBytesAtIndex(i, letter, idSession);                
                                 
            }
        }       
    }

    /// @param player address of the player
    /// @notice get the lit of the games for a given player address
    function getPlayerGames(address player) public view returns (uint256[] memory) {
        return playerGames[player].games;
    }

    /// @param idSession uint256 for identify the session
    /// @notice get the word legth for a given session
    function getSessionWordLength(uint256 idSession) public view returns (uint8){
        require(session[idSession].state == StateSession.InProgress || session[idSession].state == StateSession.Finished, "Error, This session does not have already a word");
        uint8 i = 0;
        while(i < 32 && session[idSession].word[i] != 0) {
            i++;
        }
        return i;
    }

    /// @param b bytes1 to check if is letter or not
    /// @notice check if is a letter
    function isLetter(bytes1 b) public pure returns (bool) {        
        if(!(b >= 0x61 && b<= 0x7A)) {  //a-z              
                return false;
        }                
        return true;
    }  

    // pour test fct a supprimer
    function getRandomWords() public view returns (uint256[] memory){
      return s_randomWords;
    }

    // // function getReachableSession() public view returns(ReachableSession[] memory){
     
    // // }
    // function getSessionsReachable() public  view returns(bool pOneFoundWord, bool ptwoWin,uint256 idSession , address payable playerOne, address payable playerTwo, uint256 betSize, bytes32 word){
        
    //     return (session[id].playerOneFoundWord, session[id].playerTwoFoundWord, session[id].idSession, session[id].playerOne, session[id].playerTwo, session[id].betSize, session[id].word);
    // }

    function getStructPartOne(uint256 id) public  view returns(bool pOneFoundWord, bool ptwoWin,uint256 idSession , address payable playerOne, address payable playerTwo, uint256 betSize, bytes32 word){
        return (session[id].playerOneFoundWord, session[id].playerTwoFoundWord, session[id].idSession, session[id].playerOne, session[id].playerTwo, session[id].betSize, session[id].word);
    }

    function getStructPartTwo(uint256 id) public view returns(bool firstLetterRemplaced, StateSession  state, address mustPlay, bytes32  playerOneGuess, bytes32 playerTwoGuess){
        return (session[id].firstLetterRemplaced ,session[id].state, session[id].mustPlay, session[id].playerOneGuess, session[id].playerTwoGuess);
    }


}