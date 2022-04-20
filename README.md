# À propos de l'application Frise chronologique

* Licence : [AGPL v3](http://www.gnu.org/licenses/agpl.txt) - Copyright Région Hauts-de-France (ex Picardie)
* Développeur(s) : ATOS
* Financeur(s) : Région Hauts-de-France (ex Picardie)
* Description : Application de conception de frise chronologique multimédia  (partageable dans l'ENT) qui s'appuie sur la librairie  http://timeline.knightlab.com/.

# Documentation technique

## Construction

<pre>
		gradle copyMod
</pre>

## Déployer dans ent-core

## Configuration

Dans le fichier `/timeline-generator/deployment/timelinegenerator/conf.json.template` :

Déclarer l'application dans la liste :
<pre>
{
  "name": "net.atos~timelinegenerator~0.2.0",
	"config": {
	    "main" : "net.atos.entng.timelinegenerator.TimelineGenerator",
	    "port" : 8099,
	    "app-name" : "TimelineGenerator",
	    "app-address" : "/timelinegenerator",
	    "app-icon" : "timelinegenerator-large",
	    "host": "${host}",
	    "ssl" : $ssl,
	    "userbook-host": "${host}",
	    "integration-mode" : "HTTP",
	    "app-registry.port" : 8012,
	    "mode" : "${mode}",
	    "entcore.port" : 8009
       }
}
</pre>

Associer une route d'entée à la configuration du module proxy intégré (`"name": "net.atos~timelinegenerator~0.2.0"`) :
<pre>
	{
		"location": "/timelinegenerator",
		"proxy_pass": "http://localhost:8099"
	}
</pre>

# Présentation du module

## Fonctionnalités

La frise chronologique permet d'associer des événements à leur position dans le temps et de les représenter sous la forme d'une frise temporelle.

Des permissions sur les différentes actions possibles sur les frises chronologiques, dont la contribution et la gestion, sont configurées dans la frise chronologique (via des partages Ent-core).
Le droit de lecture, correspondant à qui peut consulter la frise chronologique est également configuré de cette manière.

La frise chronologique met en œuvre un comportement de recherche sur le titre et le descriptif de la frise (les évènements ne sont pas recherchés).

## Modèle de persistance

Les données du module sont stockées dans deux collections Mongo :
 - "timelinegenerator" : pour toutes les données propres aux frises chronologiques
 - "timelinegeneratorevent" : pour toutes les données propres aux évènements des frises

## Modèle serveur

Le module serveur utilise 2 contrôleurs de déclaration :

* `TimelineController` : Point d'entrée à l'application, Routage des vues, sécurité globale et déclaration de l'ensemble des comportements relatifs aux frises chronologiques (liste, création, modification, destruction et partage)
* `EventController` : Sécurité des évènements et déclaration de l'ensemble des comportements relatifs aux évènements d'une frise chronologique (création, modification, destruction et récupération)

Les contrôleurs étendent les classes du framework Ent-core exploitant les CrudServices de base. Pour des manipulations spécifiques, des classes de Service sont utilisées :

* `EventService` : Concernant les évènements de la frise chronologique

Le module serveur met en œuvre deux évènements issus du framework Ent-core :

* `TimelineGeneratorRepositoryEvents` : Logique de changement d'année scolaire
* `TimelineGeneratorSearchingEvents` : Logique de recherche

Des jsonschemas permettent de vérifier les données reçues par le serveur, ils se trouvent dans le dossier "src/main/resources/jsonschema".

## Modèle front-end

Le modèle Front-end manipule 3 objets models :

* `Timelines` : Correspondant aux frises chronologiques
* `Timeline` : Correspondant à une frise chronologique
* `Event` : Correspondant aux évènements d'une frise chronologique

Il y a une collection globale :

* `model.timelines.all` qui contient l'ensemble des objets `timeline` synchronisé depuis le serveur.
