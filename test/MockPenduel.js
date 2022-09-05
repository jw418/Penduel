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
  let testCounter = 1;

  const betSize = ether("0.00005");

  // on déploie le contrat avant chaque test
  beforeEach(async function () {
    this.MockPenduelInstance = await MockPenduel.deployed();
  });

  // on vérifie toutes les variables/constantes de notre contrat
  context("#### Test initial sate ####", () => {
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

    context("**** Test in-game balances ****", () => {
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

    context(
      "**** Test playerGames array && getPlayerGames functions ****",
      () => {
        it(`${testCounter++}: owner games array must be empty`, async function () {
          const arrayOwner = await this.MockPenduelInstance.getPlayerGames(
            owner
          );
          await expect(arrayOwner).to.be.deep.equal([], `array not empty`);
        });

        it(`${testCounter++}: PlayerOne games array must be empty`, async function () {
          const arrayP1 = await this.MockPenduelInstance.getPlayerGames(
            player1
          );
          await expect(arrayP1).to.be.deep.equal([], `array not empty`);
        });

        it(`${testCounter++}: PlayerTwo games array must be empty`, async function () {
          const arrayP2 = await this.MockPenduelInstance.getPlayerGames(
            player2
          );
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
      }
    );

    context("**** Test initial sessionPublic struct ****", () => {
      context("++++ Test sessionPublic 0 ++++", () => {
        beforeEach(async function () {
          this.session0 = await this.MockPenduelInstance.sessionPublic(0);
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

        it(`${testCounter++}: wordLength must be 0`, async function () {
          await expect(this.session0.wordLegth).to.be.bignumber.equal(
            "0",
            `wordLength is not 0`
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

      context("++++ Test sessionPublic 1 ++++", () => {
        beforeEach(async function () {
          this.session1 = await this.MockPenduelInstance.sessionPublic(1);
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

        it(`${testCounter++}: wordLength must be 0`, async function () {
          await expect(this.session1.wordLegth).to.be.bignumber.equal(
            "0",
            `wordLength is not 0`
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

  context("#### Test addWord function ####", () => {
    it(`${testCounter++}: should revert: not the owner`, async function () {
      await expectRevert(
        this.MockPenduelInstance.addWord(
          "0x686f6c6c69646179000000000000000000000000000000000000000000000000",
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
        "0x6b69737300000000000000000000000000000000000000000000000000000000"
      );
      await expectEvent(addWord, "WordAdded");
    });
  });

  context("#### Test pausedJoinSessionFct function ####", () => {
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

    it(`${testCounter++}: should emit an event JoinSessionFctPaused(true)`, async function () {
      await this.MockPenduelInstance.openJoinSessionFct({ from: owner });
      const paused = await this.MockPenduelInstance.pausedJoinSessionFct({
        from: owner,
      });
      await expectEvent(paused, "JoinSessionFctPaused", true);
    });
  });

  context("#### Test openJoinSessionFct function ####", () => {
    it(`${testCounter++}: Expect Revert: caller is not the owner`, async function () {
      await expectRevert(
        this.MockPenduelInstance.openJoinSessionFct({ from: notOwner }),
        `caller is not the owner`
      );
    });

    it(`${testCounter++}: Expect Revert: already open`, async function () {
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

    it(`${testCounter++}: should emit an event JoinSessionFctPaused(false)`, async function () {
      await this.MockPenduelInstance.pausedJoinSessionFct({ from: owner });
      const notPaused = await this.MockPenduelInstance.openJoinSessionFct({
        from: owner,
      });
      await expectEvent(notPaused, "JoinSessionFctPaused", false);
    });
  });

  context("#### Create a session function####", () => {
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

    context("**** Test struct change publicSession after creation ****", () => {
      beforeEach(async function () {
        this.session1 = await this.MockPenduelInstance.sessionPublic(1);
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

      it(`${testCounter++}: wordLength must be 0`, async function () {
        await expect(this.session1.wordLegth).to.be.bignumber.equal(
          "0",
          `wordLength is not 0`
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

      // it(`${testCounter++}: PlayerOne games array length must be 2`, async function () {
      //   const arrayP1 = await this.MockPenduelInstance.getPlayerGames(player1);
      //   console.log(arrayP1);

      //   const values = Object.values(arrayP1);
      //   console.log(values);
      //   await expect(values.length).to.be.bignumber.equal('2', `array not empty`);
      // });
    });
  });

  context("#### Test cancelRequest  && playerWithdraw functions ####", () => {
    it(`${testCounter++}: totalCreatedSessions must be equal to 3`, async function () {
      await this.MockPenduelInstance.createSession({
        from: player1,
        value: betSize,
      });
      const totalCreatedSessions =
        await this.MockPenduelInstance.totalCreatedSessions();
      await expect(totalCreatedSessions).to.be.bignumber.equal(
        `3`,
        `totalCreatedSessions is not 3`
      );
    });

    it(`${testCounter++}: should revert: Error, not your session`, async function () {
      await expectRevert(
        this.MockPenduelInstance.requestCancelGame(7, { from: player1 }),
        `Error, not your session`
      );
    });

    it(`${testCounter++}: should revert: session is not in reachable state`, async function () {
      await this.MockPenduelInstance.joinSession(1, {
        from: player2,
        value: betSize,
      });
      await expectRevert(
        this.MockPenduelInstance.requestCancelGame(1, { from: player1 }),
        `session is not in reachable state `
      );
    });

    it(`${testCounter++}: should revert: Error, TimeOut Not Reached`, async function () {
      await expectRevert(
        this.MockPenduelInstance.requestCancelGame(2, { from: player1 }),
        `Error, TimeOut Not Reached`
      );
    });

    it(`${testCounter++}: session 2 must be in cancelled state`, async function () {
      const timeOut = (await time.latest()).add(time.duration.hours(24));
      await time.increaseTo(timeOut.add(time.duration.minutes(1)));
      await this.MockPenduelInstance.requestCancelGame(2, { from: player1 });
      const stateSession2 = await this.MockPenduelInstance.sessionPublic(2);
      await expect(stateSession2.state).to.be.bignumber.equal(
        "6",
        "session 2 is not cancelled"
      );
    });

    it(`${testCounter++}: player1 in-game balance must be equal to betsize`, async function () {
      const balanceInGame = await this.MockPenduelInstance.balance(player1);
      this.balanceEthPlayer1 = await balance.tracker(player1);
      await expect(balanceInGame).to.be.bignumber.equal(
        betSize,
        "in-game balance is not equal to betSize"
      );
    });

    it(`${testCounter++}: expect after withdraw player1 in-game balance must be equal to zero`, async function () {
      await this.MockPenduelInstance.playerWithdraw({ from: player1 });
      const balanceInGame = await this.MockPenduelInstance.balance(player1);
      await expect(balanceInGame).to.be.bignumber.equal(
        "0",
        "in-game balance is not equal to zero"
      );
    });

    it(`${testCounter++}: expect after withdraw player1 eth balance must be change`, async function () {
      const delta = await this.balanceEthPlayer1.delta();
      const stringDelta = delta.toString();
      const fees = 419340000000000;
      const stringExpect = (betSize - fees).toString();
      await expect(stringDelta).to.be.equal(
        stringExpect,
        "balance not corectly change"
      );
    });
  });

  context(
    "#### Test JoinSession && getSessionWordLength && compareAndCopy functions ####",
    () => {
      it(`${testCounter++}: Expect Revert join a session function is paused`, async function () {
        await this.MockPenduelInstance.pausedJoinSessionFct();
        await expectRevert(
          this.MockPenduelInstance.joinSession(1, {
            from: player2,
            value: betSize,
          }),
          `join a session function is paused`
        );
      });

      it(`${testCounter++}: Expect Revert: Error, already in this session`, async function () {
        await this.MockPenduelInstance.openJoinSessionFct();
        await expectRevert(
          this.MockPenduelInstance.joinSession(1, { from: player1 }),
          `Error, already in this session`
        );
      });

      it(`${testCounter++}: Expect Revert insufficent vault`, async function () {
        await expectRevert(
          this.MockPenduelInstance.joinSession(3, {
            from: player2,
            value: ether("9999999999999999"),
          }),
          `Error, insufficent vault balance`
        );
      });

      it(`${testCounter++}: Expect Revert: Error, insufficent amount sent`, async function () {
        const lowerBetSize = (betSize - 1).toFixed();
        await expectRevert(
          this.MockPenduelInstance.joinSession(3, {
            from: player2,
            value: lowerBetSize,
          }),
          `Error, insufficent amount sent`
        );
      });

      it(`${testCounter++}: Expect Revert: Error, session unreachable`, async function () {
        await expectRevert(
          this.MockPenduelInstance.joinSession(2, {
            from: player2,
            value: betSize,
          }),
          `Error, session unreachable`
        );
      });

      context(
        "**** Test sessionPublic 3 after player 2 has joined ****",
        () => {
          beforeEach(async function () {
            this.session3 = await this.MockPenduelInstance.sessionPublic(3);
          });
          it(`${testCounter++}: playerOne must be player1 address`, async function () {
            const joinSession3 = await this.MockPenduelInstance.joinSession(3, {
              from: player2,
              value: betSize,
            });
            await expectEvent(joinSession3, "SessionJoined", {
              idSession: "3",
              playerTwo: player2,
            });
          });

          it(`${testCounter++}: playerOne must be player1 address`, async function () {
            await expect(this.session3.playerOne).to.be.equal(
              player1,
              `playerOne is not a player1 address`
            );
          });

          it(`${testCounter++}: mustPlay must be player2 address`, async function () {
            await expect(this.session3.mustPlay).to.be.equal(
              player2,
              `mustPlay is not a player2 address`
            );
          });

          it(`${testCounter++}: wordLength must not be 0`, async function () {
            await expect(this.session3.wordLegth).to.be.bignumber.not.equal(
              "0",
              `wordLength is not 0`
            );
          });

          it(`${testCounter++}: idSession must be 3`, async function () {
            await expect(this.session3.idSession).to.be.bignumber.equal(
              "3",
              `idSession is not 3`
            );
          });

          it(`${testCounter++}: betSize must be betSize`, async function () {
            await expect(this.session3.betSize).to.be.bignumber.equal(
              betSize,
              `betSize is not 0`
            );
          });

          it(`${testCounter++}: playerOne guess first letter must be remplaced`, async function () {
            await expect(this.session3.playerOneGuess[2] != 0).to.be.equal(
              true,
              `playerOneGuess first letter not remplaced`
            );
          });

          it(`${testCounter++}: playertwo guess first letter must be remplaced`, async function () {
            await expect(this.session3.playerTwoGuess[2] != 0).to.be.equal(
              true,
              `playerTwoGuess first letter not remplaced`
            );
          });

          it(`${testCounter++}: session state must be 2 (InProgress State)`, async function () {
            await expect(this.session3.state).to.be.bignumber.equal(
              "2",
              `session state is not 2`
            );
          });

          // it(`${testCounter++}: PlayerTwo games array must be [1,3]`, async function () {
          //   const arrayP2 = await this.MockPenduelInstance.getPlayerGames(player2);
          //   console.log(arrayP2);
          //   const values = Object.values(arrayP2);
          //   const one = 1;
          //   const three = 3;
          //   console.log(values);
          //   await expect(arrayP2).to.include([one.toFixed(), three.toFixed()], `array not empty`);
          // });
        }
      );
    }
  );

  context("#### Test requestVictoryTimeOut function ####", () => {
    it(`${testCounter++}: Expect Revert: Error, TimeOut Not Reached`, async function () {
      await expectRevert(
        this.MockPenduelInstance.requestWinTimeout(3, {
          from: player1,
        }),
        `Error, TimeOut Not Reached`
      );
    });

    it(`${testCounter++}: Expect Revert: opponent has played OR not your session (not a player)`, async function () {
      const timeOut = (await time.latest()).add(time.duration.hours(24));
      await time.increaseTo(timeOut.add(time.duration.minutes(1)));
      await expectRevert(
        this.MockPenduelInstance.requestWinTimeout(3, {
          from: notPlayer,
        }),
        `opponent has played OR not your session`
      );
    });

    it(`${testCounter++}: Expect Revert: Error, session is not in progress`, async function () {
      await this.MockPenduelInstance.createSession({
        from: player1,
        value: betSize,
      });
      const timeOut = (await time.latest()).add(time.duration.hours(24));
      await time.increaseTo(timeOut.add(time.duration.minutes(1)));
      await expectRevert(
        this.MockPenduelInstance.requestWinTimeout(4, {
          from: player1,
        }),
        `Error, session is not in progress`
      );
    });

    it(`${testCounter++}: session 4 state must be 7 (victory p1 by timeout session)`, async function () {
      await this.MockPenduelInstance.joinSession(4, {
        from: player2,
        value: betSize,
      });
      const timeOut = (await time.latest()).add(time.duration.hours(24));
      await time.increaseTo(timeOut.add(time.duration.minutes(1)));
      await this.MockPenduelInstance.requestWinTimeout(4, {
        from: player1,
      });
      const session4 = await this.MockPenduelInstance.sessionPublic(4);
      const state = session4.state;
      await expect(state).to.be.bignumber.equal("7", "state is not equal to 7");
    });

    it(`${testCounter++}: Player One in-game balance must be equal to betSize x 2`, async function () {
      const inGameBalanceP1 = await this.MockPenduelInstance.balance(player1);
      const expectedBalance = betSize * 2;
      await expect(inGameBalanceP1).to.be.bignumber.equal(
        expectedBalance.toFixed(),
        "balance is not equal to betsize x 2"
      );
    });
  });

  context(
    "#### Test play  && isLetter && replaceByteAtIndex functions ####",
    () => {
      it(`${testCounter++}: Expect Revert not your turn`, async function () {
        await expectRevert(
          this.MockPenduelInstance.play(`0x62`, 1, { from: player1 }),
          `is not your turn`
        );
      });

      it(`${testCounter++}: Expect Revert: Error, only lowercase letter`, async function () {
        await this.MockPenduelInstance.createSession({
          from: player1,
          value: betSize,
        });
        await this.MockPenduelInstance.joinSession(5, {
          from: player2,
          value: betSize,
        });
        await expectRevert(
          this.MockPenduelInstance.play(`0x80`, 5, { from: player2 }),
          `Error, only lowercase letter`
        );
      });

      it(`${testCounter++}: should emit an event has played`, async function () {
        const player2Move = await this.MockPenduelInstance.play(`0x62`, 5, {
          from: player2,
        });
        await expectEvent(player2Move, "HasPlayed", {
          idSession: "5",
          player: player2,
        });
      });

      it(`${testCounter++}: player1 should win state 3 (PlayerOnewin State)`, async function () {
        const session5 = await this.MockPenduelInstance.sessionPublic(5);
        const length = session5.wordLegth.toNumber();

        if (length == 3) {
          await this.MockPenduelInstance.play(`0x75`, 5, { from: player1 });
          await this.MockPenduelInstance.play(`0x7a`, 5, { from: player2 });
          await this.MockPenduelInstance.play(`0x6e`, 5, { from: player1 });
        } else if (length == 4) {
          await this.MockPenduelInstance.play(`0x69`, 5, { from: player1 });
          await this.MockPenduelInstance.play(`0x7a`, 5, { from: player2 });
          await this.MockPenduelInstance.play(`0x73`, 5, { from: player1 });
        } else {
          console.log("error!!");
        }

        const session5Bis = await this.MockPenduelInstance.sessionPublic(5);
        const stateS5 = session5Bis.state;
        await expect(stateS5).to.be.bignumber.equal(`3`, "state is not 3");
      });

      it(`${testCounter++}: Player One in-game balance must be equal to betSize x 4`, async function () {
        const inGameBalanceP1 = await this.MockPenduelInstance.balance(player1);
        const expectedBalance = betSize * 4;
        await expect(inGameBalanceP1).to.be.bignumber.equal(
          expectedBalance.toFixed(),
          "balance is not equal to betsize x 4"
        );
      });

      it(`${testCounter++}: player2 should win state 3 (PlayerTwoWin State)`, async function () {
        await this.MockPenduelInstance.createSession({
          from: player1,
          value: betSize,
        });
        await this.MockPenduelInstance.joinSession(6, {
          from: player2,
          value: betSize,
        });
        const session6 = await this.MockPenduelInstance.sessionPublic(6);
        const length = session6.wordLegth.toNumber();

        if (length == 3) {
          await this.MockPenduelInstance.play(`0x75`, 6, { from: player2 });
          await this.MockPenduelInstance.play(`0x7a`, 6, { from: player1 });
          await this.MockPenduelInstance.play(`0x6e`, 6, { from: player2 });
          await this.MockPenduelInstance.play(`0x7a`, 6, { from: player1 });
        } else if (length == 4) {
          await this.MockPenduelInstance.play(`0x69`, 6, { from: player2 });
          await this.MockPenduelInstance.play(`0x7a`, 6, { from: player1 });
          await this.MockPenduelInstance.play(`0x73`, 6, { from: player2 });
          await this.MockPenduelInstance.play(`0x7a`, 6, { from: player1 });
        } else {
          console.log("error!!");
        }

        const session6Bis = await this.MockPenduelInstance.sessionPublic(6);
        const stateS6 = session6Bis.state;
        await expect(stateS6).to.be.bignumber.equal(`4`, "state is not 4");
      });

      it(`${testCounter++}: Player Two in-game balance must be equal to betSize x 2`, async function () {
        const inGameBalanceP2 = await this.MockPenduelInstance.balance(player2);
        const expectedBalance = betSize * 2;
        await expect(inGameBalanceP2).to.be.bignumber.equal(
          expectedBalance.toFixed(),
          "balance is not equal to betsize x 2"
        );
      });

      it(`${testCounter++}: state should be state 5 (Draw State)`, async function () {
        await this.MockPenduelInstance.createSession({
          from: player1,
          value: betSize,
        });
        await this.MockPenduelInstance.joinSession(7, {
          from: player2,
          value: betSize,
        });
        const session7 = await this.MockPenduelInstance.sessionPublic(7);
        const length = session7.wordLegth.toNumber();

        if (length == 3) {
          await this.MockPenduelInstance.play(`0x75`, 7, { from: player2 });
          await this.MockPenduelInstance.play(`0x75`, 7, { from: player1 });
          await this.MockPenduelInstance.play(`0x6e`, 7, { from: player2 });
          await this.MockPenduelInstance.play(`0x6e`, 7, { from: player1 });
        } else if (length == 4) {
          await this.MockPenduelInstance.play(`0x69`, 7, { from: player2 });
          await this.MockPenduelInstance.play(`0x69`, 7, { from: player1 });
          await this.MockPenduelInstance.play(`0x73`, 7, { from: player2 });
          await this.MockPenduelInstance.play(`0x73`, 7, { from: player1 });
        } else {
          console.log("error!!");
        }

        const session7Bis = await this.MockPenduelInstance.sessionPublic(7);
        const stateS7 = session7Bis.state;
        await expect(stateS7).to.be.bignumber.equal(`5`, "state is not 5");
      });

      it(`${testCounter++}: Player Two in-game balance must be equal to betSize x 3`, async function () {
        const inGameBalanceP2 = await this.MockPenduelInstance.balance(player2);
        const expectedBalance = betSize * 3;
        await expect(inGameBalanceP2).to.be.bignumber.equal(
          expectedBalance.toFixed(),
          "balance is not equal to betsize x 3"
        );
      });

      it(`${testCounter++}: Player One in-game balance must be equal to betSize x 5`, async function () {
        const inGameBalanceP1 = await this.MockPenduelInstance.balance(player1);
        const expectedBalance = betSize * 5;
        await expect(inGameBalanceP1).to.be.bignumber.equal(
          expectedBalance.toFixed(),
          "balance is not equal to betsize x 5"
        );
      });

    }
  );
});
