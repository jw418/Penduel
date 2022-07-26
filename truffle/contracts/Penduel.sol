// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

// import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../../node_modules/@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../../node_modules/@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

/// @title Penduel
/// @author jw418
/// @notice You can use this contract for only the most basic simulation
/// @dev This contract can cointains exploit, deploy this contract on tesnet only!!
contract Penduel is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID for CHAINLINK.
    uint64 public s_subscriptionId;   //8023
    // Rinkeby coordinator   
    address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;
    bytes32 s_keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc; 
    uint32 callbackGasLimit = 100000;
    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;
    uint32 numWords =  1;
    uint256[] public s_randomWords;           
    bytes32[] _words = [bytes32("hello"),bytes32("goodbye"),bytes32("sun"),
                        bytes32("holliday"),bytes32("before"),bytes32("after"),
                        bytes32("special")];

    address payable public admin;     
    uint256 public totalCreatedSessions;
    // uint256 private constant ROLL_IN_PROGRESS = 99999;

    // mapping(uint256 => address) private s_rollers;

    mapping(uint256 => uint256) private reqId;

    mapping(uint256 => Sessions) session;           // map un uint(idSession) avec une session    
    mapping(address => bool) public _blacklist;    // liste des joueurs blacklisté
    mapping(address => uint256) public balance;
    mapping(address => Players) private _player;    

    struct Sessions {
        uint256 idSession;           
        address payable playerOne;
        address payable playerTwo;
        uint256 betSize;        
        bytes32 word;
        StateSession  state;
        address mustPlay;
        bytes1[] lettersPlayedPOne;
        bytes1[] lettersPlayedPtwo;
    }
   

    struct Players {
        bytes1[] lettersPlayed;
        uint256[] games; 
    }
  
    enum StateSession {
        NotCreated,
        Joignable,
        EnCours,
        Termine
    }
 
    modifier onlyAdmin() {
        require(msg.sender == admin, "caller is not the admin");
        _;
    }

    modifier onlyPlayer(uint256 idSession) {
        require(msg.sender == session[idSession].mustPlay, "is not your turn");
        _;
    }

    /// events
    event Withdraw(address admin, uint256 amount);
    event Received(address indexed sender, uint256 amount);
    event SessionCreated(uint idSession, address playerOne, uint256 betSize);
    event SessionJoined(uint idSession, address playerTwo);
    event DiceRolled(uint256 indexed requestId, uint256 indexed idSession);
    event DiceLanded(uint256 indexed requestId);

    constructor(uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {    
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        admin = payable(msg.sender);
        s_subscriptionId = subscriptionId;
    }

    /* Allows this contract to receive payments */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }    

    function isLetter(bytes1 b) public pure returns (bool) {        
        if(            
                !(b >= 0x41 && b <= 0x5A) && //A-Z
                !(b >= 0x61 && b<= 0x7A) //a-z          
            )
                return false;        
        return true;
    }  

    /// @notice
    function withdrawEther(uint256 amount) external payable onlyAdmin {
        require(address(this).balance>=amount, 'Error, contract has insufficent balance');
        admin.transfer(amount);
    
        emit Withdraw(admin, amount);
    }

    /// @notice
    function addWord(bytes32 word) external onlyAdmin {
        _words.push(word);
  
    }

    /// @notice
    function createSession() payable public {
        require(msg.sender.balance>=msg.value, 'Error, insufficent vault balance');
        require(msg.value > 0, 'Error, minimum 1 WEI');
        totalCreatedSessions++;
        session[totalCreatedSessions].playerOne = payable(msg.sender); 
        session[totalCreatedSessions].idSession = totalCreatedSessions;
        session[totalCreatedSessions].playerOne = payable(msg.sender);
        session[totalCreatedSessions].betSize = msg.value;        
        session[totalCreatedSessions].state = StateSession.Joignable;        

        emit SessionCreated(totalCreatedSessions, msg.sender, msg.value);
    }

    /// @notice
    function joinSession(uint256 idSession) payable public returns (uint256 requestId){
        require(msg.sender != session[idSession].playerOne, 'Error, your are already in this session');
        require(msg.sender.balance >= msg.value, 'Error, insufficent vault balance');
        require(msg.value >= session[idSession].betSize, 'Error, insufficent vault balance');
        require(session[idSession].state == StateSession.Joignable, 'Error, session already full, finished or does not exsist');     
        
        session[idSession].playerTwo = payable(msg.sender);
        requestId = COORDINATOR.requestRandomWords(
        s_keyHash,
        s_subscriptionId,
        requestConfirmations,
        callbackGasLimit,
        numWords
        );
        reqId[requestId] = session[idSession].idSession;         //mapping(uint256 => uint256) private reqId;
        
        emit DiceRolled(requestId, idSession);

        session[idSession].state = StateSession.EnCours;
        session[idSession].mustPlay = session[idSession].playerTwo;

        emit SessionJoined(idSession, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal  override{

        uint256 value = randomWords[0] % _words.length;
        session[reqId[requestId]].word = _words[value]; 

        // emitting event to signal that dice landed
        emit DiceLanded(requestId);
    }    


    /// @notice
    function play(bytes1 letter, uint256 idSession) public  onlyPlayer(idSession) {  

        require(session[idSession].word.length > 1 , "Dice not rolled");
        require(isLetter(letter) == true, "Error, is not a letter"); 
        require(session[idSession].playerTwo != address(0x0), "Error, await for a second player");
        
        
        if (msg.sender == session[idSession].playerOne) {            
            session[idSession].lettersPlayedPOne.push(letter);
            session[idSession].mustPlay = session[idSession].playerTwo;
        }

        if (msg.sender == session[idSession].playerTwo){
            session[idSession].lettersPlayedPtwo.push(letter);
            session[idSession].mustPlay = session[idSession].playerOne;
        }        
    }

    function getStruct(uint256 id) public  view returns(uint256 idSession , address payable playerOne, address payable playerTwo, uint256 betSize, bytes32 word){
        return (session[id].idSession, session[id].playerOne, session[id].playerTwo, session[id].betSize, session[id].word) ;
    }

    function getStructPart(uint256 id) public view returns(StateSession  state, address mustPlay, bytes1[] memory lettersPlayedPOne, bytes1[] memory lettersPlayedPtwo){
        return (session[id].state, session[id].mustPlay, session[id].lettersPlayedPOne, session[id].lettersPlayedPtwo);
    }
    

    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    //     function checkLetter(string memory _letter, uint256 idSession) internal pure returns(bool){
    //         while 
    //         if(bytes(_letter).length != bytes(b).length) {
    //              return false;
    //         } else {
    //              return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    //         }
    //     } 

    //      // Assumes the subscription is funded sufficiently.
    //      function requestRandomWords() external  {
    //          // Will revert if subscription is not set and funded.
    //          s_requestId = COORDINATOR.requestRandomWords(
    //          s_keyHash,
    //          s_subscriptionId,
    //          requestConfirmations,
    //          callbackGasLimit,
    //          numWords
    //          );
    //      }

    // function getSlice(string memory word) public pure returns (string[] memory) {
    //     bytes memory a = new bytes(lengthString(word));
    //     for(uint i=0;i<=lengthString(word);i++){
    //         push(a[i])
    //         a[i] = bytes(text)[i+begin-1];
    //     }
    //     return string(a);    
    // }

    //     function getSlice(string memory word) public pure returns (string memory) {
    //     bytes memory a = new bytes(lengthString(word));
    //     for(uint i=1;i<=lengthString(word);i++){
    //         a[i] = bytes(word)[i];
    //     }
    //     return string(a);    
    // }

    //   function getSlice(uint256 begin, uint256 end, string memory text) public pure returns (string memory) {
    //     bytes memory a = new bytes(end-begin+1);
    //     for(uint i=0;i<=end-begin;i++){
    //         a[i] = bytes(text)[i+begin-1];
    //     }
    //     return string(a);    
    // }



}