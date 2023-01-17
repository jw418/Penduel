 # Penduel  :crossed_swords:

Jeu du Pendu en Duel, créer une partie avec la mise souhaitée ou rejoignez une partie, le vainqueur remporte le tout.
DAPP réalisé dans le cadre de la formation développeur blockchain d'Alyra.


Adresse du contract: 0xD1f5b4fB58D99c93d91376FC0E110c2078B840AE (Goerli) <br/>
EtherScan: https://goerli.etherscan.io/address/0xD1f5b4fB58D99c93d91376FC0E110c2078B840AE <br/>
Vidéo de démonstration: https://youtu.be/iz33uqRb9r4 <br/>
Faucet: https://goerlifaucet.com/ <br/>

DAPP: https://floral-darkness-8082.on.fleek.co/

![](https://github.com/jw418/Penduel/blob/main/img/hangmanScreenshot.PNG)


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
Sinon directement sur: https://floral-darkness-8082.on.fleek.co/ <br/>
Assurez-vous d'être sur le réseau de test Goerli.

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
_ rng volontairement dans le contract<br/>
_ ignoré: varaiable utilisé comme indiqué par chainlink<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_2.PNG)
Reetrency: ligne 280 l'etat de la session est changé<
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
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_3.PNG)
Ignoré<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_4.PNG)
Reentrency pas possible grace au require, si la fonction s'exécute partiellement cela n'afffectera que l'utilisateur qui apelle la fonction(il ne pourra pas jouer et le jouer 1 pourra demander un remboursement). Cependant dans le cas ou l'utilisateur n'est pas malicieux et que la fonction ne s'exécute pas complétement il pourrait alors être lésé.<br/>

Action: déplacé l'appelle de la fonction requestRandomWords() en fin de fonction, dans ce cas si la fonction est interrompue avant la fin aucun mot ne sera générer et apres 3h les joueurs pourront demander a ce que la partie soit annulé &&  "sessionPublic[idSession].state = StateSession.InProgress;" placé juste après les require.<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_5.PNG)<br/>
Ignoré: un require revert la fonction  si nécéssaire <br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_6.PNG)<br/>
Ignoré: même en cas de manipulation c'est comparaison n'ont pas besoin d'une grande précisions<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_7.PNG)<br/>
Action: suppression des égalités<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_8.PNG)<br/>
Ignoré<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_9.PNG)<br/>
Ignoré: require en fin de fonction qui vérifie l'exécution<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_10.PNG)<br/>
Ignoré: pour les mixedCase (pas pertinent)<br/>
Action: Event name modifié <br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_11.PNG)<br/>
Action: uint32 callbackGasLimit = 200000; ==> uint32 callbackGasLimit = 2 * (10**5);<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_12.PNG)<br/>
Action: ajout de l'attribut constant<br/>
<br/>

![](https://github.com/jw418/Penduel/blob/main/img/CaptureSlither_13.PNG)<br/>
Action: dans MockPenduel.sol pour la fonction joinSession() passé de public a external<br/>
<br/>
