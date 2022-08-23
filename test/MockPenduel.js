// import des SC
const MockPenduel = artifacts.require(`MockPenduel`);
// import chai/test-helpers
const {
  BN,
  expectRevert,
  expectEvent,
  balance,
  send,
  ether,
  time,
} = require(`@openzeppelin/test-helpers`);
const { expect } = require(`chai`);
const constants = require("@openzeppelin/test-helpers/src/constants");

contract(`MockPenduel`, function (accounts) {
  // constant des adresses pour les tests
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const notPlayer = accounts[8];
  const notOwner = accounts[9];

  // variable qui permet de numéroter nos tests
  var testCounter = 1;

  const betSize = ether("0.00005");

  // on déploie le contrat avant chaque test
  beforeEach(async function () {
    this.MockPenduelInstance = await MockPenduel.deployed();
  });

  // on vérifie toutes les variables/constantes de notre contrat
  describe("#### Test initial sate ####", () => {
    it(`${testCounter++}: admin must be equal to owner`, async function () {
      const admin = await this.MockPenduelInstance.owner();
      await expect(admin).to.be.equal(owner, `admin is not owner`);
    });

    it(`${testCounter++}: joinSessionFctOpen must be false`, async function () {
      const openOrNot = await this.MockPenduelInstance.joinSessionFctOpen();
      await expect(openOrNot).to.be.equal(
        false,
        `joinSessionFctOpen is not false`
      );
    });

    it(`${testCounter++}: totalCreatedSessions must be equal to 0`, async function () {
      const totalCreatedSessions =
        await this.MockPenduelInstance.totalCreatedSessions();
      await expect(totalCreatedSessions).to.be.bignumber.equal(
        `0`,
        `totalCreatedSessions is not 0`
      );
    });

    it(`${testCounter++}: timeOut must be equal to 24 hours`, async function () {
      const timeOut = await this.MockPenduelInstance.timeOut();
      await expect(timeOut).to.be.bignumber.equal(
        `86400`,
        `timeOut is not 24 hours`
      );
    });

    describe("**** Test in-game balances ****", () => {
      it(`${testCounter++}: owner in-game balance must be 0`, async function () {
        const balanceOwner = await this.MockPenduelInstance.balance(owner);
        await expect(balanceOwner).to.be.bignumber.equal(
          `0`,
          `owner balance is not null`
        );
      });

      it(`${testCounter++}: player1 in-game balance must be 0`, async function () {
        const balancePlayer1 = await this.MockPenduelInstance.balance(player1);
        await expect(balancePlayer1).to.be.bignumber.equal(
          `0`,
          `player1 balance is not null`
        );
      });

      it(`${testCounter++}: player2 in-game balance must be 0`, async function () {
        const balancePlayer2 = await this.MockPenduelInstance.balance(player2);
        await expect(balancePlayer2).to.be.bignumber.equal(
          `0`,
          `player2 balance is not null`
        );
      });

      it(`${testCounter++}: notPlayer in-game balance must be 0`, async function () {
        const balanceNotPlayer = await this.MockPenduelInstance.balance(
          notPlayer
        );
        await expect(balanceNotPlayer).to.be.bignumber.equal(
          `0`,
          `notPlayer balance is not null`
        );
      });

      it(`${testCounter++}: notOwner in-game balance must be 0`, async function () {
        const balanceNotOwner = await this.MockPenduelInstance.balance(
          notOwner
        );
        await expect(balanceNotOwner).to.be.bignumber.equal(
          `0`,
          `notOwner balance is not null`
        );
      });
    });

    describe("**** Test playerGames array ****", () => {
      it(`${testCounter++}: owner games array must be empty`, async function () {
        const arrayOwner = await this.MockPenduelInstance.getPlayerGames(owner);
        await expect(arrayOwner).to.be.deep.equal([], `array not empty`);
      });

      it(`${testCounter++}: PlayerOne games array must be empty`, async function () {
        const arrayP1 = await this.MockPenduelInstance.getPlayerGames(player1);
        await expect(arrayP1).to.be.deep.equal([], `array not empty`);
      });

      it(`${testCounter++}: PlayerTwo games array must be empty`, async function () {
        const arrayP2 = await this.MockPenduelInstance.getPlayerGames(player2);
        await expect(arrayP2).to.be.deep.equal([], `array not empty`);
      });

      it(`${testCounter++}: notPlayer games array must be empty`, async function () {
        const arrayNotPlayer = await this.MockPenduelInstance.getPlayerGames(
          notPlayer
        );
        await expect(arrayNotPlayer).to.be.deep.equal([], `array not empty`);
      });

      it(`${testCounter++}: notOwner games array must be empty`, async function () {
        const arrayNotOwner = await this.MockPenduelInstance.getPlayerGames(
          notOwner
        );
        await expect(arrayNotOwner).to.be.deep.equal([], `array not empty`);
      });
    });

    describe("**** Test initial sessionPublic struct ****", () => {
      describe("++++ Test sessionPublic 0 ++++", () => {
        beforeEach(async function () {
          this.session0 = await this.MockPenduelInstance.sessionPublic(0);
          //console.log(this.session0);
        });

        it(`${testCounter++}: playerOne must be 0x00 address`, async function () {
          await expect(this.session0.playerOne).to.be.equal(
            "0x0000000000000000000000000000000000000000",
            `playerOne is not a 0x00 address`
          );
        });

        it(`${testCounter++}: mustPlay must be 0x00 address`, async function () {
          await expect(this.session0.mustPlay).to.be.equal(
            "0x0000000000000000000000000000000000000000",
            `mustPlay is not a 0x00 address`
          );
        });

        it(`${testCounter++}: wordLenght must be 0`, async function () {
          await expect(this.session0.wordLegth).to.be.bignumber.equal(
            "0",
            `wordLenght is not 0`
          );
        });

        it(`${testCounter++}: idSession must be 0`, async function () {
          await expect(this.session0.idSession).to.be.bignumber.equal(
            "0",
            `idSession is not 0`
          );
        });

        it(`${testCounter++}: betSize must be 0`, async function () {
          await expect(this.session0.betSize).to.be.bignumber.equal(
            "0",
            `betSize is not 0`
          );
        });

        it(`${testCounter++}: playerOne guess must be a bytes32 empty string`, async function () {
          await expect(this.session0.playerOneGuess).to.be.equal(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            `playerOneGuess is not a bytes32 empty string`
          );
        });

        it(`${testCounter++}: playertwo guess must be a bytes32 empty string`, async function () {
          await expect(this.session0.playerTwoGuess).to.be.equal(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            `playerTwoGuess is not a bytes32 empty string`
          );
        });

        it(`${testCounter++}: session state must be 0 (NotCreated State)`, async function () {
          await expect(this.session0.state).to.be.bignumber.equal(
            "0",
            `session state is not 0`
          );
        });
      });

      describe("++++ Test sessionPublic 1 ++++", () => {
        beforeEach(async function () {
          this.session1 = await this.MockPenduelInstance.sessionPublic(1);
          // console.log(this.session1);
        });

        it(`${testCounter++}: playerOne must be 0x00 address`, async function () {
          await expect(this.session1.playerOne).to.be.equal(
            "0x0000000000000000000000000000000000000000",
            `playerOne is not a 0x00 address`
          );
        });

        it(`${testCounter++}: playerTwo must be 0x00 address`, async function () {
          await expect(this.session1.playerTwo).to.be.equal(
            "0x0000000000000000000000000000000000000000",
            `playerTwo is not a 0x00 address`
          );
        });

        it(`${testCounter++}: mustPlay must be 0x00 address`, async function () {
          await expect(this.session1.mustPlay).to.be.equal(
            "0x0000000000000000000000000000000000000000",
            `mustPlay is not a 0x00 address`
          );
        });

        it(`${testCounter++}: wordLenght must be 0`, async function () {
          await expect(this.session1.wordLegth).to.be.bignumber.equal(
            "0",
            `wordLenght is not 0`
          );
        });

        it(`${testCounter++}: idSession must be 0`, async function () {
          await expect(this.session1.idSession).to.be.bignumber.equal(
            "0",
            `idSession is not 0`
          );
        });

        it(`${testCounter++}: betSize must be 0`, async function () {
          await expect(this.session1.betSize).to.be.bignumber.equal(
            "0",
            `betSize is not betSize`
          );
        });

        it(`${testCounter++}: playerOne guess must be a bytes32 empty string`, async function () {
          await expect(this.session1.playerOneGuess).to.be.equal(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            `playerOneGuess is not a bytes32 empty string`
          );
        });

        it(`${testCounter++}: playertwo guess must be a bytes32 empty string`, async function () {
          await expect(this.session1.playerTwoGuess).to.be.equal(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            `playerTwoGuess is not a bytes32 empty string`
          );
        });

        it(`${testCounter++}: session state must be 0 (NotCreated State)`, async function () {
          await expect(this.session1.state).to.be.bignumber.equal(
            "0",
            `session state is not 0`
          );
        });
      });
    });
  });

  describe("#### Test addWord function ####", () => {
    it(`${testCounter++}: should revert: not the owner`, async function () {
      await expectRevert(
        this.MockPenduelInstance.addWord(
          "0x616c797261000000000000000000000000000000000000000000000000000000",
          { from: notOwner }
        ),
        "caller is not the owner"
      );
    });

    it(`${testCounter++}: should revert: not lower case word`, async function () {
      await expectRevert(
        this.MockPenduelInstance.addWord(
          "0x41656c6c6f000000000000000000000000000000000000000000000000000000"
        ),
        "Error, lowercase letters only"
      );
    });

    it(`${testCounter++}: should emit an event WordAdded`, async function () {
      const addWord = await this.MockPenduelInstance.addWord(
        "0x61656c6c6f000000000000000000000000000000000000000000000000000000"
      );
      await expectEvent(addWord, "WordAdded");
    });
  });

  describe("#### Test pausedJoinSessionFct function ####", () => {
    it(`${testCounter++}: Expect Revert: caller is not the owner`, async function () {
      await expectRevert(
        this.MockPenduelInstance.pausedJoinSessionFct({ from: notOwner }),
        `caller is not the owner`
      );
    });

    it(`${testCounter++}: Expect Revert: already paused`, async function () {
      await expectRevert(
        this.MockPenduelInstance.pausedJoinSessionFct(),
        `Error, Already paused`
      );
    });

    it(`${testCounter++}: joinSessionFctOpen must be false `, async function () {
      await this.MockPenduelInstance.openJoinSessionFct({ from: owner });
      await this.MockPenduelInstance.pausedJoinSessionFct({ from: owner });
      const openOrNot = await this.MockPenduelInstance.joinSessionFctOpen();
      await expect(openOrNot).to.equal(false, "is not false");
    });

    it(`${testCounter++}: should emit an event joinSessionFctPaused(true)`, async function () {
      await this.MockPenduelInstance.openJoinSessionFct({ from: owner });
      const paused = await this.MockPenduelInstance.pausedJoinSessionFct({
        from: owner,
      });
      await expectEvent(paused, "joinSessionFctPaused", true);
    });
  });

  describe("#### Test openJoinSessionFct function ####", () => {
    it(`${testCounter++}: Expect Revert: caller is not the owner`, async function () {
      await expectRevert(
        this.MockPenduelInstance.openJoinSessionFct({ from: notOwner }),
        `caller is not the owner`
      );
    });

    it(`${testCounter++}: Expect Revert: already open`, async function () {
      console.log();
      await this.MockPenduelInstance.openJoinSessionFct({ from: owner });
      await expectRevert(
        this.MockPenduelInstance.openJoinSessionFct(),
        `Error, Already open`
      );
    });

    it(`${testCounter++}: joinSessionFctOpen must be true `, async function () {
      const openOrNot = await this.MockPenduelInstance.joinSessionFctOpen();
      await expect(openOrNot).to.equal(true, "is not true");
    });

    it(`${testCounter++}: should emit an event joinSessionFctPaused(false)`, async function () {
      await this.MockPenduelInstance.pausedJoinSessionFct({ from: owner });
      const notPaused = await this.MockPenduelInstance.openJoinSessionFct({
        from: owner,
      });
      await expectEvent(notPaused, "joinSessionFctPaused", false);
    });
  });

  describe("#### Create a session function####", () => {
    it(`${testCounter++}: Expect Revert insufficent vault`, async function () {
      await expectRevert(
        this.MockPenduelInstance.createSession({
          from: player1,
          value: ether("9999999999999999"),
        }),
        `Error, insufficent vault balance`
      );
    });

    it(`${testCounter++}: Expect Revert minimun 1 wei`, async function () {
      await expectRevert(
        this.MockPenduelInstance.createSession({ from: player1, value: 0 }),
        `Error, minimum 1 WEI`
      );
    });

    it(`${testCounter++}: totalCreatedSessions must be equal to 1`, async function () {
      await this.MockPenduelInstance.createSession({
        from: player1,
        value: betSize,
      });
      const totalCreatedSessions =
        await this.MockPenduelInstance.totalCreatedSessions();
      await expect(totalCreatedSessions).to.be.bignumber.equal(
        `1`,
        `totalCreatedSessions is not 1`
      );
    });

    it(`${testCounter++}: should emit an event session created`, async function () {
      //const createSession = await this.MockPenduelInstance.createSession({from:  player1, value:betSize});
      await expectEvent(
        await this.MockPenduelInstance.createSession({
          from: player1,
          value: betSize,
        }),
        "SessionCreated",
        {
          idSession: "2",
          playerOne: player1,
          betSize: betSize,
        }
      );
    });

    describe("**** Test struct change publicSession ****", () => {
      beforeEach(async function () {
        this.session1 = await this.MockPenduelInstance.sessionPublic(1);
        //console.log(this.session1);
      });

      it(`${testCounter++}: playerOne must be player1 address`, async function () {
        await expect(this.session1.playerOne).to.be.equal(
          player1,
          `playerOne is not a player1 address`
        );
      });

      it(`${testCounter++}: mustPlay must be 0x00 address`, async function () {
        await expect(this.session1.mustPlay).to.be.equal(
          "0x0000000000000000000000000000000000000000",
          `mustPlay is not a 0x00 address`
        );
      });

      it(`${testCounter++}: wordLenght must be 0`, async function () {
        await expect(this.session1.wordLegth).to.be.bignumber.equal(
          "0",
          `wordLenght is not 0`
        );
      });

      it(`${testCounter++}: idSession must be 1`, async function () {
        await expect(this.session1.idSession).to.be.bignumber.equal(
          "1",
          `idSession is not 1`
        );
      });

      it(`${testCounter++}: betSize must be betSize`, async function () {
        await expect(this.session1.betSize).to.be.bignumber.equal(
          betSize,
          `betSize is not 0`
        );
      });

      it(`${testCounter++}: playerOne guess must be a bytes32 empty string`, async function () {
        await expect(this.session1.playerOneGuess).to.be.equal(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          `playerOneGuess is not a bytes32 empty string`
        );
      });

      it(`${testCounter++}: playertwo guess must be a bytes32 empty string`, async function () {
        await expect(this.session1.playerTwoGuess).to.be.equal(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          `playerTwoGuess is not a bytes32 empty string`
        );
      });

      it(`${testCounter++}: session state must be 1 (Reachable State)`, async function () {
        await expect(this.session1.state).to.be.bignumber.equal(
          "1",
          `session state is not 1`
        );
      });
    });
  });

  describe("#### Test play function ####", () => {
    it(`${testCounter++}: Expect Revert not your turn`, async function () {
      await expectRevert(
        this.MockPenduelInstance.play(`0x80`, 1, { from: player1 }),
        `is not your turn`
      );
    });
  });

  describe("#### Test getPlayerGames function ####", () => {});

  describe("#### Test getSessionWordLength function ####", () => {});

  describe("#### Test compareAndCopy function ####", () => {});

  describe("#### Test isLetter function ####", () => {});

  describe("#### Test isLowerCaseWord function ####", () => {});

  describe("#### Test replaceByteAtIndex function ####", () => {});

  describe("#### Test JoinSession function ####", () => {});

  describe("#### Test cancelrequest function ####", () => {});

  describe("#### Test requestVictoryTimeOut function ####", () => {});

  describe("#### Test playerWithdraw function ####", () => {});
});
