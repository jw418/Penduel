# Penduel  :crossed_swords:

Jeu du Pendu en Duel, créer une partie avec la mise souhaitée ou rejoignez une partie, le vainqueur remporte le tout.
DAPP réalisé dans le cadre de la formation développeur blockchain d'Alyra.


Adresse du contract: 0xAEe6F610C619629E2C42De7E4bD7d27Af215cbeC (rinkeby) <br/>
EtherScan: https://rinkeby.etherscan.io/address/0xAEe6F610C619629E2C42De7E4bD7d27Af215cbeC <br/>
Vidéo de démonstration: https://youtu.be/iz33uqRb9r4 <br/>
Faucet: https://faucets.chain.link/rinkeby <br/>

DAPP: https://hangsmans-versus-game.herokuapp.com/

![](https://github.com/jw418/Penduel/blob/main/img/CaptureFront.PNG)


## Installation 🛠️

Pour ce projet de DAPP j'ai utilisé React Truffle Box.
Vous pouvez copiez le repo avec la commande : 
```sh
git clone https://github.com/jw418/Penduel.git
```
Pour installer les dépendances allez à la racine du fichier et utilisez les commandes suivante :
```sh
npm install
cd client
npm install
```
Pensez à modifier le fichier truffle-config.js selon le réseau choisi.
https://trufflesuite.com/docs/truffle/reference/configuration/

Puis si nécessaire à créer et à configurer votre fichier .ENV à la racine et l'ajouter à votre .gitignore.

## Front
Pour voir le front en local:
```sh
 cd client
 npm run start
```
Sinon directement sur: https://hangsmans-versus-game.herokuapp.com// <br/>
Assurez-vous d'être sur le réseau de test Rinkeby.

![](https://github.com/jw418/Penduel/blob/main/img/CaptureRinkeby.PNG)



# Tests(en cours d'écriture) :test_tube:

Pour exécuter les test du smart contract:

Allez à la racine du projet et tapez la commande:
```sh
truffle test ./test/MockPenduel.js
```
 
J'ai essayer la méthode décrite ici: https://betterprogramming.pub/how-to-mock-chainlink-vrf-coordinator-v2-and-aggregator-v3-with-truffle-0-8-0-24353b96858e pour faire les tests en local avec les faux contrats vrf v2 coordinator fourni par chainlink mais sans succès. J'ai donc repris de zéro avec une version du contrat sans chainlink.

![](https://github.com/jw418/Penduel/blob/main/img/CaptureTests.PNG)


