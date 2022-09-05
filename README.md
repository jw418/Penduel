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



# Tests :test_tube:

Pour exécuter les test du smart contract:

Allez à la racine du projet et tapez la commande:
```sh
truffle test ./test/MockPenduel.js
```
![](https://github.com/jw418/Penduel/blob/main/img/CaptureTests_1.PNG)
![](https://github.com/jw418/Penduel/blob/main/img/CaptureTests_2.PNG)


J'ai essayer la méthode décrite ici: https://betterprogramming.pub/how-to-mock-chainlink-vrf-coordinator-v2-and-aggregator-v3-with-truffle-0-8-0-24353b96858e pour faire les tests en local avec les faux contrats vrf v2 coordinator fourni par chainlink mais sans succès. J'ai donc repris de zéro avec une version du contrat sans chainlink.

# Slither

Outil qui met en évidence certaines vulnérabilités.

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_1.PNG)
_ rng volontairement dans le contract
_ ignoré: varaiable utilisé comme indiqué par chainlink
![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_2.PNG)
Reetrency: ligne 280 l'etat de la session est changé
```sh
 sessionPublic[idSession].state = StateSession.InProgress;
 ```
 en cas de reentrency le require ligne 273 empeche l'execution de la fonction:
 ```sh
  require(
            sessionPublic[idSession].state == StateSession.Reachable,
            "Error, session unreachable"
        );
```        
![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_3.PNG)
Ignoré

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_4.PNG)
Reentrency pas possible grace au require, si la fonction s'exécute partiellement cela n'afffectera que l'utilisateur qui apelle la fonction(il ne pourra pas jouer et le jouer 1 pourra demander un remboursement). Cependant dans le cas ou l'utilisateur n'est pas malicieux et que la fonction ne s'exécute pas complétement il pourrait alors être lésé.

Action: déplacé l'appelle de la fonction requestRandomWords() en fin de fonction, dans ce cas si la fonction est interrompue avant la fin aucun mot ne sera générer et apres 3h les joueurs pourront demander a ce que la partie soit annulé &&  "sessionPublic[idSession].state = StateSession.InProgress;" placé juste après les require.

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_5.PNG)
Ignoré: un require revert la fonction  si nécéssaire 

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_6.PNG)
Ignoré: même en cas de manipulation c'est comparaison n'ont pas besoin d'une grande précisions

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_7.PNG)
Action: suppression des égalités

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_8.PNG)
Ignoré

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_9.PNG)
Ignoré: require en fin de fonction qui vérifie l'exécution

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_10.PNG)
Ignoré: pour les mixedCase (pas pertinent)
Action: Event name modifié 

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_11.PNG)
Action: uint32 callbackGasLimit = 200000; ==> uint32 callbackGasLimit = 2 * (10**5);

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_12.PNG)
Action: ajout de l'attribut constant

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_13.PNG)
Action: dans MockPenduel.sol pour la fonction joinSession() passé de public a external
