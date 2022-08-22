/// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/// @title Penduel
/// @author jw418
/// @notice Versus hangman's game  for test without CHAINLINK vrf v2
/// @dev This contract can cointains exploit, deploy this contract on tesnet only!!
contract MockPenduel is Ownable {
    bytes32[] _words = [
        bytes32("hello"),
        bytes32("goodbye"),
        bytes32("sun"),
        bytes32("holliday"),
        bytes32("before"),
        bytes32("after"),
        bytes32("special")
    ];
    bool public joinSessionFctOpen;
    uint256 public totalCreatedSessions;
    uint256 public timeOut = 24 hours;

    /* Mapping*/
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
    event PlayerWithdraw(address player, uint256 amount);
    event Received(address indexed sender, uint256 amount);
    event SessionCreated(uint256 idSession, address playerOne, uint256 betSize);
    event SessionJoined(uint256 idSession, address playerTwo);
    event WordAdded();
    event HasPlayed(uint256 idSession, address player);
    event joinSessionFctPaused(bool paused);

    /* Allows this contract to receive payments */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

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
        require(isLowerCaseWord(word) == true, "Error, lowercase letters only");
        _words.push(word);
        emit WordAdded();
    }

    /// @notice autorised players to use the joinSession Function
    function openJoinSessionFct() external onlyOwner {
        require(joinSessionFctOpen == false, "Error, Already open");
        joinSessionFctOpen = true;
        emit joinSessionFctPaused(false);
    }

    /// @notice unautorised players to use the joinSession Function
    function pausedJoinSessionFct() external onlyOwner {
        require(joinSessionFctOpen == true, "Error, Already paused");
        joinSessionFctOpen = false;
        emit joinSessionFctPaused(true);
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
    function joinSession(uint256 idSession) public payable {
        require(joinSessionFctOpen == true, "join a session function is paused");
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

        playerGames[msg.sender].games.push(idSession);
        sessionPublic[idSession].playerTwo = payable(msg.sender);
        session[idSession].lastMoveDate = block.timestamp; // start timeout counter
        session[idSession].requestDate = block.timestamp;
        joinSessionFctOpen = false;

        uint256 randNonce = 0;
        randNonce++;
        session[idSession].word = _words[
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.difficulty,
                        randNonce
                    )
                )
            ) % _words.length
        ];
        sessionPublic[idSession].wordLegth = getSessionWordLength(idSession);
        emit SessionJoined(idSession, msg.sender);

        if (session[idSession].firstLetterRemplaced == false) {
            compareAndCopy(
                session[idSession].word,
                session[idSession].word[0],
                idSession
            );
            session[idSession].firstLetterRemplaced = true;
        }
        sessionPublic[idSession].mustPlay = sessionPublic[idSession].playerTwo;
        sessionPublic[idSession].state = StateSession.InProgress;
    }

    /// @param idSession uint256 for identify the session
    /// @param letter played in bytes1
    /// @notice the playing function of this dapp
    function play(bytes1 letter, uint256 idSession)
        external
        onlyPlayer(idSession)
    {
        require(isLetter(letter) == true, "Error, only lowercase letter");
        require(
            sessionPublic[idSession].state == StateSession.InProgress,
            "Error, session not in progress"
        );
        require(
            sessionPublic[idSession].playerTwo != address(0x0),
            "Error, await for a second player"
        );

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
                if (session[idSession].playerTwoFoundWord == true) {
                    sessionPublic[idSession].state = StateSession.Draw;
                    balance[
                        sessionPublic[idSession].playerOne
                    ] += sessionPublic[idSession].betSize;
                    balance[
                        sessionPublic[idSession].playerTwo
                    ] += sessionPublic[idSession].betSize;
                }
                // Player one Win
                if (session[idSession].playerTwoFoundWord == false) {
                    sessionPublic[idSession].state = StateSession.PlayerOneWin;
                    balance[sessionPublic[idSession].playerOne] +=
                        sessionPublic[idSession].betSize *
                        2;
                }
            }
            // Player Two Win: Player Two find the word and player not found it
            if (
                session[idSession].playerTwoFoundWord == true &&
                (session[idSession].playerOneFoundWord == false)
            ) {
                sessionPublic[idSession].state = StateSession.PlayerTwoWin;
                balance[sessionPublic[idSession].playerTwo] +=
                    sessionPublic[idSession].betSize *
                    2;
            }
        }

        // when Player One plays
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

        if (session[idSession].firstLetterRemplaced == false) {
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
            session[idSession].firstLetterRemplaced == true
        ) {
            sessionPublic[idSession].playerOneGuess =
                (~mask & sessionPublic[idSession].playerOneGuess) |
                (bytes32(toInsert) >> (position * 8));
        }
        if (
            sessionPublic[idSession].mustPlay ==
            sessionPublic[idSession].playerTwo &&
            session[idSession].firstLetterRemplaced == true
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

    /// @param word bytes32 check if word is composed of lower case letters
    /// @notice check if is a letter
    function isLowerCaseWord(bytes32 word) private pure returns (bool) {
        for (uint8 i = 0; i < 32 && word[i] != 0; i++) {
            if (isLetter(word[i]) == false) {
                return false;
            }
        }
        return true;
    }
}
