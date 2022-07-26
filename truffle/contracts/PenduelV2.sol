// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
// import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
// import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";



/// @title Penduel
/// @author jw418
/// @notice You can use this contract for only the most basic simulation
/// @dev This contract can cointains exploit, deploy this contract on tesnet only!!
contract Penduel {
        
    bytes32[] _words = [bytes32("hello"),bytes32("goodbye"),bytes32("sun"),
                        bytes32("holliday"),bytes32("before"),bytes32("after"),
                        bytes32("special")];    

    address payable public admin;
    uint256 internal fee;       
    uint256 public totalCreatedSessions;

    mapping(uint256 => Sessions) session;         // map un uint(idSession) avec une session    
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

    constructor() {    
        admin = payable(msg.sender);
    }
     /* Allows this contract to receive payments */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function isLetter(bytes32 b) public pure returns (bool) {
       
        if(b.length != 1) return false;

        bytes1 char = b[1];
        
        if(            
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) //a-z
          
            )
                return false;
        
        return true;
    }

 
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
        require(address(this).balance>=msg.value, 'Error, insufficent vault balance');
        require(msg.value > 0, 'Error, minimum 1 WEI');
        totalCreatedSessions++;
        session[totalCreatedSessions].idSession = totalCreatedSessions;
        session[totalCreatedSessions].playerOne = payable(msg.sender);
        session[totalCreatedSessions].betSize = msg.value;
        session[totalCreatedSessions].word = _words[3];
        session[totalCreatedSessions].state = StateSession.Joignable;
        session[totalCreatedSessions].mustPlay = session[totalCreatedSessions].playerTwo;
        

        emit SessionCreated(totalCreatedSessions, msg.sender, msg.value);
    }

    /// @notice
    function joinSession(uint256 idSession) payable public {
        require(address(this) != session[idSession].playerOne, 'Error, your are already in this session');
        require(address(this).balance >= msg.value, 'Error, insufficent vault balance');
        require(msg.value >= session[idSession].betSize, 'Error, insufficent vault balance');
        require(session[idSession].state == StateSession.Joignable, 'Error, session already full or finished');
        session[idSession].playerTwo = payable(msg.sender);
        session[totalCreatedSessions].state = StateSession.EnCours;

        emit SessionJoined(totalCreatedSessions, msg.sender);
    }

    function getStruct(uint256 id) public  view returns(uint256 idSession , address payable playerOne, address payable playerTwo, uint256 betSize, bytes32 word){
        return (session[id].idSession, session[id].playerOne, session[id].playerTwo, session[id].betSize, session[id].word) ;
    }

    function getStructPart(uint256 id) public view returns(StateSession  state, address mustPlay, bytes1[] memory lettersPlayedPOne, bytes1[] memory lettersPlayedPtwo){
        return (session[id].state, session[id].mustPlay, session[id].lettersPlayedPOne, session[id].lettersPlayedPtwo);

    }
    /// @notice
    function play(bytes1 letter, uint256 idSession) public  onlyPlayer(idSession) {        
        
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

//     function checkLetter(string memory _letter, uint256 idSession) internal pure returns(bool){
//         while 
//         if(bytes(_letter).length != bytes(b).length) {
//              return false;
//         } else {
//              return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
//         }
//     } 
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

}