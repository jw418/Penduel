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
    
    string[] public letters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w'];
    string[] internal _words =['hello','goodbye','sun','complex','mouse','cream','screen'];
    bytes public mot = 'hello';
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
        string word;
        StateSession  state;
        address mustPlay;
        string[] lettersPlayedPOne;
        string[] lettersPlayedPtwo;
    }
   

    struct Players {
        string[] lettersPlayed;
        uint256[] games; 
    }

  
    enum StateSession {
        Joignable,
        EnCours,
        Termine
    }

 
    modifier onlyAdmin() {
        require(msg.sender == admin, "caller is not the admin");
        _;
    }

    /// events
    event Withdraw(address admin, uint256 amount);
    event Received(address indexed sender, uint256 amount);

    constructor() {    
        admin = payable(msg.sender);  
    }
     /* Allows this contract to receive payments */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// @notice
    function withdrawEther(uint256 amount) external payable onlyAdmin {
        require(address(this).balance>=amount, 'Error, contract has insufficent balance');
        admin.transfer(amount);
    
        emit Withdraw(admin, amount);
    }


    /// @notice
    function addWord(string memory word) external onlyAdmin {
        _words.push(word);
  
    }

    /// @notice
    function createSession() payable public {
        require(address(this).balance>=msg.value, 'Error, insufficent vault balance');
        session[totalCreatedSessions+1].idSession = totalCreatedSessions+1;
        session[totalCreatedSessions+1].playerOne = payable(msg.sender);
        session[totalCreatedSessions+1].betSize = msg.value;
        session[totalCreatedSessions+1].word = _words[3];
        session[totalCreatedSessions+1].state = StateSession.Joignable;
        session[totalCreatedSessions+1].mustPlay = PlayerTurn.NoOne;
    }

    /// @notice
    function joinSession(uint256 idSession) payable public {
        require(address(this) != session[idSession].playerOne, 'Error, your are already in this session');
        require(address(this).balance >= msg.value, 'Error, insufficent vault balance');
        require(msg.value >= session[idSession].betSize, 'Error, insufficent vault balance');
        require(session[idSession].state == StateSession.Joignable, 'Error, session already full or finished');
        session[idSession].playerTwo = payable(msg.sender);
        session[totalCreatedSessions+1].state = StateSession.EnCours;
    }


    /// @notice
    function play(string memory letter, uint256 idSession) public {

        require(session[idSession].mustPlay != PlayerTurn.NoOne);
        require((msg.sender == session[idSession].playerOne && session[idSession].mustPlay == PlayerTurn.PlayerOne) || (msg.sender == session[idSession].playerTwo && session[idSession].mustPlay == PlayerTurn.PlayerTwo),'Error, not your turn');
        if (msg.sender == session[idSession].playerOne) {
            checkLetter(letter);
            session[idSession].lettersPlayedPOne.push(letter);
            session[idSession].mustPlay = PlayerTurn.PlayerTwo;
        }

        if (msg.sender == session[idSession].playerTwo){
            session[idSession].lettersPlayedPtwo.push(letter);
            session[idSession].mustPlay = PlayerTurn.PlayerOne;
        }    
        

    }

    function checkLetter(string memory _letter, uint256 idsession) internal pure returns(bool){
        while 
        if(bytes(_letter).length != bytes(b).length) {
 return false;
 } else {
 return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
 }
    } 



}