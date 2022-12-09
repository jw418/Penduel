/// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

/// @title Penduel
/// @author jw418
/// @notice Versus hangman's game
/// @dev This contract can cointains exploit, deploy this contract on tesnet only!!
contract Penduel is VRFConsumerBaseV2, Ownable {
    VRFCoordinatorV2Interface COORDINATOR;

    /* Chainlink's VRF V2  variables */

    uint16 constant requestConfirmations = 3; // The default is 3, but you can set this higher.
    uint32 constant callbackGasLimit = 2 * (10**5);
    uint32 constant numWords = 1; // Number of random number at each request.
    uint64 public s_subscriptionId; // Your subscription ID for CHAINLINK   // 8023
    uint256[] public s_randomWords; // For the FullFill Fct
    address constant public vrfCoordinator = 0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D; // Goerli coordinator
    bytes32 constant public s_keyHash = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15; // 150 gwei Key Hash

    bool public joinSessionFctOpen;
    uint256 public totalCreatedSessions;
    uint256 constant timeOut = 24 hours;
    bytes32[] _words = [
        bytes32("hello"),
        bytes32("goodbye"),
        bytes32("sun"),
        bytes32("holliday"),
        bytes32("before"),
        bytes32("after"),
        bytes32("restoration"),
        bytes32("fashion"),
        bytes32("dressing"),
        bytes32("representative"),
        bytes32("silence"),
        bytes32("acceptable"),
        bytes32("environmental"),
        bytes32("photocopy")
    ];

    /* Mapping*/
    mapping(uint256 => uint256) private reqId; //  associate a request with a game session
    mapping(uint256 => uint256) private reqIdPublic;
    mapping(uint256 => Sessions) private session; //  mapping an uint(idSession) with a session
    mapping(uint256 => SessionPublic) public sessionPublic;
    mapping(address => uint256) public balance; //  gamers balances
    mapping(address => Player) playerGames; //  attached a gamer addres with his sessions

    struct Sessions {
        bool playerOneFoundWord;
        bool playerTwoFoundWord;
        bool firstLetterRemplaced;
        uint256 idSession;
        uint256 requestDate;
        uint256 lastMoveDate;
        bytes32 word;
    }

    struct SessionPublic {
        address payable playerOne;
        address payable playerTwo;
        address mustPlay;
        uint8 wordLegth;
        uint256 idSession;
        uint256 betSize;
        bytes32 playerOneGuess;
        bytes32 playerTwoGuess;
        StateSession state;
    }

    struct Player {
        uint256[] games;
    }

    enum StateSession {
        NotCreated,
        Reachable,
        InProgress,
        PlayerOneWin,
        PlayerTwoWin,
        Draw,
        Cancelled,
        POneWinByTimeout,
        PTwoWinByTimeout
    }

    modifier onlyPlayer(uint256 idSession) {
        require(
            msg.sender == sessionPublic[idSession].mustPlay,
            "is not your turn"
        );
        _;
    }

    /* Events */
    event PlayerWithdraw(address player, uint256 amount); // change for playerWithdraw (no deployed)
    // event Received(address indexed sender, uint256 amount);
    event SessionCreated(uint256 idSession, address playerOne, uint256 betSize);
    event SessionJoined(uint256 idSession, address playerTwo);
    event RNGRequested(uint256 indexed requestId, uint256 indexed idSession);
    event RNGFound(uint256 indexed requestId);
    event RandomWordsTaken(uint256[] randomWords);
    event WordAdded();
    event HasPlayed(uint256 idSession, address player);
    event JoinSessionFctPaused(bool paused);

    /* Constructor*/
    /// @dev go to your chainlink account to see your subcription ID
    /// @dev when the contract is deployed do not forget to add this contract to your consumer
    constructor(uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
    }

    // /* Allows this contract to receive payments */
    // receive() external payable {
    //     emit Received(msg.sender, msg.value);
    // }

    /// @notice a withdraw function for players
    function playerWithdraw() external {
        uint256 toSend = balance[msg.sender];
        balance[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: toSend}("");
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
        emit PlayerWithdraw(msg.sender, toSend);
    }

    /// @param idSession uint256 for identify the session
    /// @notice if chainlink took too many times for given a rng the player can ask for a refund
    function refundRNGnotFound(uint256 idSession) external {
        require(
            msg.sender == sessionPublic[idSession].playerOne ||
                msg.sender == sessionPublic[idSession].playerTwo,
            "Error, Not your session"
        );
        require(
            session[idSession].word[0] == "",
            "Error, RNG word already found"
        );
        require(
            block.timestamp > (session[idSession].requestDate + 3 hours),
            "Error, TimeOut Not Reached"
        );
        sessionPublic[idSession].state = StateSession.Cancelled;
        balance[sessionPublic[idSession].playerOne] += sessionPublic[idSession]
            .betSize;
        balance[sessionPublic[idSession].playerTwo] += sessionPublic[idSession]
            .betSize;
    }

    /// @param idSession uint256 for identify the session
    /// @notice if the opponent player took too many times for playing you can ask for a win by TimeOut
    function requestWinTimeout(uint256 idSession) external {
        require(
            block.timestamp > (timeOut + session[idSession].lastMoveDate),
            "Error, TimeOut Not Reached"
        );
        require(
            (msg.sender == sessionPublic[idSession].playerOne &&
                sessionPublic[idSession].mustPlay ==
                sessionPublic[idSession].playerTwo) ||
                (msg.sender == sessionPublic[idSession].playerTwo &&
                    sessionPublic[idSession].mustPlay ==
                    sessionPublic[idSession].playerOne),
            "opponent has played OR not your session"
        );
        require(
            sessionPublic[idSession].state == StateSession.InProgress,
            "Error, session is not in progress"
        );

        if (msg.sender == sessionPublic[idSession].playerOne) {
            sessionPublic[idSession].state = StateSession.POneWinByTimeout;
            balance[sessionPublic[idSession].playerOne] +=
                sessionPublic[idSession].betSize *
                2;
        }
        if (msg.sender == sessionPublic[idSession].playerTwo) {
            sessionPublic[idSession].state = StateSession.PTwoWinByTimeout;
            balance[sessionPublic[idSession].playerTwo] +=
                sessionPublic[idSession].betSize *
                2;
        }
    }

    /// @param idSession uint256 for identify the session
    /// @notice 24hours after the creation of the game the creator can cancel it if no one join it
    function requestCancelGame(uint256 idSession) external {
        require(
            msg.sender == sessionPublic[idSession].playerOne,
            "Error, not your session"
        );
        require(
            sessionPublic[idSession].state == StateSession.Reachable,
            "session is not in reachable state "
        );
        require(
            block.timestamp > (session[idSession].requestDate + timeOut),
            "Error, TimeOut Not Reached"
        );

        sessionPublic[idSession].state = StateSession.Cancelled;
        balance[sessionPublic[idSession].playerOne] += sessionPublic[idSession]
            .betSize;
    }

    /// @param word it is a bytes32
    /// @notice allows the owner to add words to the list for the game
    function addWord(bytes32 word) external onlyOwner {
        require(isLowerCaseWord(word), "Error, lowercase letters only"); // !! require non déployé
        _words.push(word);
        emit WordAdded();
    }

    /// @dev first make sure that the contract has been added to the consumers on your chainlik subscription management page
    /// @notice autorised players to use the joinSession Function
    function openJoinSessionFct() external onlyOwner {
        require(!joinSessionFctOpen, "Error, Already open");
        joinSessionFctOpen = true;
        emit JoinSessionFctPaused(false);
    }

    /// @notice unautorised players to use the joinSession Function
    function pausedJoinSessionFct() external onlyOwner {
        require(joinSessionFctOpen, "Error, Already paused");
        joinSessionFctOpen = false;
        emit JoinSessionFctPaused(true);
    }

    /// @notice for create a new game session
    function createSession() external payable {
        require(
            msg.sender.balance >= msg.value,
            "Error, insufficent vault balance"
        );
        require(msg.value > 0, "Error, minimum 1 WEI");
        totalCreatedSessions++;
        playerGames[msg.sender].games.push(totalCreatedSessions);
        sessionPublic[totalCreatedSessions].playerOne = payable(msg.sender);
        session[totalCreatedSessions].idSession = totalCreatedSessions;
        sessionPublic[totalCreatedSessions].idSession = totalCreatedSessions;
        sessionPublic[totalCreatedSessions].playerOne = payable(msg.sender);
        sessionPublic[totalCreatedSessions].betSize = msg.value;
        session[totalCreatedSessions].requestDate = block.timestamp;
        sessionPublic[totalCreatedSessions].state = StateSession.Reachable;

        emit SessionCreated(totalCreatedSessions, msg.sender, msg.value);
    }

    /// @dev this function request for randomness
    /// @notice for join a session already created
    function joinSession(uint256 idSession)
        external
        payable
        returns (uint256 requestId)
    {
        require(joinSessionFctOpen, "Error, past RNGrequest not found");
        require(
            msg.sender != sessionPublic[idSession].playerOne,
            "Error, already in this session"
        );
        require(
            msg.sender.balance >= msg.value,
            "Error, insufficent vault balance"
        );
        require(
            msg.value >= sessionPublic[idSession].betSize,
            "Error, insufficent amount sent"
        );
        require(
            sessionPublic[idSession].state == StateSession.Reachable,
            "Error, session unreachable"
        );

        sessionPublic[idSession].state = StateSession.InProgress;
        sessionPublic[idSession].playerTwo = payable(msg.sender);
        session[idSession].requestDate = block.timestamp;
        sessionPublic[idSession].mustPlay = sessionPublic[idSession].playerTwo;
        playerGames[msg.sender].games.push(idSession);
        joinSessionFctOpen = false;
        emit SessionJoined(idSession, msg.sender);
       
        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        reqId[requestId] = session[idSession].idSession; // here we mapping request id with a session
        reqIdPublic[requestId] = session[idSession].idSession; // same here with the public part for the front-end
        emit RNGRequested(requestId, idSession);
    }

    /// @param requestId uint256 for identify the rng request
    /// @param randomWords is a mandatory arry for this chainlink function
    /// @dev The fulfillRandomWords function must not revert
    /// @notice this function is call by the vrf coordinator and permit to attribute a rng word to the session
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        uint256 value = randomWords[0] % _words.length;
        session[reqId[requestId]].word = _words[value];
        sessionPublic[reqIdPublic[requestId]].wordLegth = getSessionWordLength(
            reqId[requestId]
        );
        // emitting event to signal rng was founded
        emit RNGFound(requestId);
        emit RandomWordsTaken(randomWords);
        joinSessionFctOpen = true;

        // here we remplaced the first letter
        if (!session[reqId[requestId]].firstLetterRemplaced) {
            compareAndCopy(
                session[reqId[requestId]].word,
                session[reqId[requestId]].word[0],
                reqId[requestId]
            );
            session[reqId[requestId]].firstLetterRemplaced = true;
        }
        session[reqId[requestId]].lastMoveDate = block.timestamp; // start timeout counter
        // rng was founded so we can open the session
    }

    /// @param idSession uint256 for identify the session
    /// @param letter played in bytes1
    /// @notice the playing function of this dapp
    function play(bytes1 letter, uint256 idSession)
        external
        onlyPlayer(idSession)
    {
        require(isLetter(letter), "Error, only lowercase letter");
        require(
            sessionPublic[idSession].state == StateSession.InProgress,
            "Error, session not in progress"
        );
        require(
            sessionPublic[idSession].playerTwo != address(0x0),
            "Error, await for a second player"
        );
        require(session[idSession].word[0] != "", "RNG word not already found");

        // when Player One plays
        if (msg.sender == sessionPublic[idSession].playerOne) {
            compareAndCopy(session[idSession].word, letter, idSession);
            sessionPublic[idSession].mustPlay = sessionPublic[idSession]
                .playerTwo;
            session[idSession].lastMoveDate = block.timestamp;
            emit HasPlayed(idSession, sessionPublic[idSession].playerOne);

            // Player one Find the word
            if (
                session[idSession].word ==
                sessionPublic[idSession].playerOneGuess
            ) {
                session[idSession].playerOneFoundWord = true;
                // Draw
                if (session[idSession].playerTwoFoundWord) {
                    sessionPublic[idSession].state = StateSession.Draw;
                    balance[
                        sessionPublic[idSession].playerOne
                    ] += sessionPublic[idSession].betSize;
                    balance[
                        sessionPublic[idSession].playerTwo
                    ] += sessionPublic[idSession].betSize;
                }
                // Player one Win
                if (!session[idSession].playerTwoFoundWord) {
                    sessionPublic[idSession].state = StateSession.PlayerOneWin;
                    balance[sessionPublic[idSession].playerOne] +=
                        sessionPublic[idSession].betSize *
                        2;
                }
            }
            // Player Two Win: Player Two find the word and player not found it
            if (
                session[idSession].playerTwoFoundWord &&
                !session[idSession].playerOneFoundWord
            ) {
                sessionPublic[idSession].state = StateSession.PlayerTwoWin;
                balance[sessionPublic[idSession].playerTwo] +=
                    sessionPublic[idSession].betSize *
                    2;
            }
        }

        // when Player Two plays
        if (msg.sender == sessionPublic[idSession].playerTwo) {
            compareAndCopy(session[idSession].word, letter, idSession);
            sessionPublic[idSession].mustPlay = sessionPublic[idSession]
                .playerOne;
            session[idSession].lastMoveDate = block.timestamp;
            emit HasPlayed(idSession, sessionPublic[idSession].playerTwo);

            // Player Two find the world
            if (
                session[idSession].word ==
                sessionPublic[idSession].playerTwoGuess
            ) {
                session[idSession].playerTwoFoundWord = true;
            }
        }
    }

    /// @param position of the letter to change
    /// @param toInsert letter to copy in bytes1
    /// @param idSession uint256 for identify the session
    /// @notice replaceBytesAtIndex
    function replaceBytesAtIndex(
        uint8 position,
        bytes1 toInsert,
        uint256 idSession
    ) private {
        bytes1 maskBytes = 0xff;
        bytes32 mask = bytes32(maskBytes) >> (position * 8);

        if (!session[idSession].firstLetterRemplaced) {
            sessionPublic[idSession].playerOneGuess =
                (~mask & sessionPublic[idSession].playerOneGuess) |
                (bytes32(toInsert) >> (position * 8));
            sessionPublic[idSession].playerTwoGuess =
                (~mask & sessionPublic[idSession].playerTwoGuess) |
                (bytes32(toInsert) >> (position * 8));
        }

        if (
            sessionPublic[idSession].mustPlay ==
            sessionPublic[idSession].playerOne &&
            session[idSession].firstLetterRemplaced
        ) {
            sessionPublic[idSession].playerOneGuess =
                (~mask & sessionPublic[idSession].playerOneGuess) |
                (bytes32(toInsert) >> (position * 8));
        }
        if (
            sessionPublic[idSession].mustPlay ==
            sessionPublic[idSession].playerTwo &&
            session[idSession].firstLetterRemplaced
        ) {
            sessionPublic[idSession].playerTwoGuess =
                (~mask & sessionPublic[idSession].playerTwoGuess) |
                (bytes32(toInsert) >> (position * 8));
        }
    }

    /// @param word to compare
    /// @param letter to check
    /// @param idSession uint256 for identify the session
    /// @notice compare and copy identical letter
    function compareAndCopy(
        bytes32 word,
        bytes1 letter,
        uint256 idSession
    ) private {
        for (uint8 i = 0; i < 32 && word[i] != 0; i++) {
            if (word[i] == letter) {
                replaceBytesAtIndex(i, letter, idSession);
            }
        }
    }

    /// @param player address of the player
    /// @notice get the lit of the games for a given player address
    function getPlayerGames(address player)
        external
        view
        returns (uint256[] memory)
    {
        return playerGames[player].games;
    }

    /// @param idSession uint256 for identify the sesFsion
    /// @notice get the word legth for a given session
    function getSessionWordLength(uint256 idSession)
        private
        view
        returns (uint8)
    {
        require(
            sessionPublic[idSession].state != StateSession.NotCreated &&
                sessionPublic[idSession].state != StateSession.Reachable,
            "Error, This session does not have already a word"
        );
        uint8 i = 0;
        while (i < 32 && session[idSession].word[i] != 0) {
            i++;
        }
        return i;
    }

    /// @param b bytes1 to check if is letter or not
    /// @notice check if is a letter
    function isLetter(bytes1 b) private pure returns (bool) {
        if (!(b >= 0x61 && b <= 0x7A)) {
            //a-z
            return false;
        }
        return true;
    }

    /// !! fonction non-déployé
    /// @param word bytes32 check if word is composed of lower case letters
    /// @notice check if is a letter
    function isLowerCaseWord(bytes32 word) private pure returns (bool) {
        for (uint8 i = 0; i < 32 && word[i] != 0; i++) {
            if (!isLetter(word[i])) {
                return false;
            }
        }
        return true;
    }
}
