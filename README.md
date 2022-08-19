# Penduel

Jeu du Pendu en Duel, créer une partie avec la mise souhaitée ou rejoignez une partie, le vainqueur remporte le tout.
DAPP réalisé dans le cadre de la formation développeur blockchain d'Alyra.


Adresse du contract: 0xAEe6F610C619629E2C42De7E4bD7d27Af215cbeC (rinkeby) <br/>
EtherScan: https://rinkeby.etherscan.io/address/0xAEe6F610C619629E2C42De7E4bD7d27Af215cbeC <br/>
Vidéo de démonstration: https://youtu.be/iz33uqRb9r4 <br/>
Faucet: https://faucets.chain.link/rinkeby <br/>

DAPP: https://hangsmans-versus-game.herokuapp.com/

![](https://github.com/jw418/Penduel/blob/main/img/CaptureFront.PNG)


## Installation 🛠️

Pour notre Dapp nous avons utilisé React Truffle Box.
Vous pouvez copiez notre repo avec la commande : 
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

## Usage

## Front
Pour voir le front en local:
```sh
 cd client
 npm run start
```
Sinon directement sur: https://hangsmans-versus-game.herokuapp.com//

#### Test en cours d'écriture
j'ai essayer longuement de faire les test en local avec les faux contrats vrf v2 coordinator de chainlink mais sans succès. j'ai donc repris de zéro avec une version du contrat sans chainlink 

![](https://github.com/jw418/Penduel/blob/main/img/CaptureTests.PNG)


