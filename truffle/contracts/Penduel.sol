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
    string[] private _words =['hello','goodbye','sun','complex','mouse','cream','screen'];
    address payable public admin;
   

    struct Sessions {
        uint256 idSession;
        address playerOne;
        address PlayerTwo;
        uint256 betSize;    
        string word;
        StateSession state;
        }

    enum StateSession {
        Joignable,
        EnCours,
        Termine
    }

    uint256 internal fee;

    mapping(uint256 => Sessions) session;         // map un uint(idSession) avec une session    
    mapping(address=> bool) public _blacklist;    // liste des joueurs blacklisté
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "caller is not the admin");
        _;
    }

    event Withdraw(address admin, uint256 amount);

    constructor() {    
        admin = payable(msg.sender);  
    }

    function withdrawEther(uint256 amount) external payable onlyAdmin {
        require(address(this).balance>=amount, 'Error, contract has insufficent balance');
        admin.transfer(amount);
    
        emit Withdraw(admin, amount);
    }

    function addWord(string memory word) external onlyAdmin {
        _words.push(word);
  
    }

    function createSession() payable public {
      
    }

    function joinSession(uint256 idSession) payable public {

    }

    function play(string memory letter, uint256 idSession) public {

    }



}