# VIVOPaths

VIVOPaths ist eine Applikation zur Visualisierung von semantischen Verbindungen in Forschungsnetzwerken.

Das Projekt ist als alleinstehende Webapp mit aus der TIB-VIVO-Installation exportierten Daten unter https://hornmo.github.io/vivopaths/ zu erreichen.

## VIVO-Integration

Die Applikation ist in ihrem aktuellen Status als alleinstehende Webseite konzipiert. Für die Integration in VIVO müssen Anpassungen an den Freemarker-Templates vorgenommen werden. Für die VIVO-Version 1.8 (Download unter: http://sourceforge.net/projects/vivo/files/VIVO%20Application%20Source/) ist eine gepackte Installation - [vivopaths_deploy_V1.8.tar.gz](vivopaths_deploy_V1.8.tar.gz) - vorhanden. Diese ist nach der Installation des tib2016-Themes in den Quellordner zu entpacken. Damit werden die Templates zur Implementierung von VIVOPaths angepasst. Um die Funktionalität der Links zu den VIVO-Profilen herzustellen, muss in der JavaScript-Datei [vpaths.js](vpaths.js) die Konstante *BASEURI* in die aktuelle URL der VIVO-Installation abgeändert werden.

## Datenbasis und Datenaktualisierung

### Manuelle Datenbeschaffung

Die manuelle Aktualisierung von Daten erfolgt in verschiedenen Schritten.

1. Im Ordner [queries](queries) liegen verschiedene SPARQL-Abfragen in Dateien zur Verfügung. Diese können in VIVO im Seitenadministrationsbereich eingefügt werden, um aktualisierte Daten zu erhalten. Die Abfragen sind aufgeteilt in die verschiedene Typen *Personen*,*Publikationen*,*Konzepte* und *Projekte*. 

2. Die erhaltenen Ergebnisse im RS_JSON-Format werden im Ordner [data](data) in entsprechend benannten JSON-Dateien zwischengespeichert.

3. Das Perl-Script [merge.pl](merge.pl) fügt diese zu der finalen Datei [merged_data.json](merged_data.json) zusammen, auf die aus der ScriptDatei zugegriffen wird.

### Mögliche Automatisierung

Ist der Fuseki-Endpoint für die verwendete VIVO-Installation aktiviert, können die von VIVOPaths verwendeten Daten über ein Kommandozeilenscript aktualisiert werden. 
