# Filmposter nach der Antwort

Stand: 10.10.2026. Nutzerauftrag: Poster zunächst für alle Sci-Fi-Filme nach der Antwort anzeigen. **Noch nicht umgesetzt; TMDB-Zugang fehlt**, vom Nutzer bestätigt. Es wurden keine Poster heruntergeladen oder veröffentlicht.

## Umfang und Darstellung

Der [zuletzt geprüfte Gesamtbestand](Genres-100-2026-10-08/Bestandsuebersicht.md) umfasst 153 Science-Fiction-Filmfassungen mit 1.168 Fragen. Originaltitel und Erstjahr bestimmen die Filmfassung. Die Anzeige soll in der gemeinsamen Antwortauflösung und im unmittelbaren Rundenrückblick erfolgen; vor der Antwort bleibt das Poster verborgen. `src/Explanation.tsx` enthält bereits die Schauspielerporträts und ist der passende Einbaupunkt. Fragen, Wissensziel-IDs und private Spielstände benötigen dafür keine Änderung.

## Quelle und offene Voraussetzungen

TMDB bietet eine API für Filmbilder. Nichtkommerzielle Nutzung verlangt Quellenkennzeichnung einschließlich Logo und Anbieterhinweis. Ein API-Schlüssel setzt einen eigenen Account und Zustimmung zu den Bedingungen voraus. [Offizielle FAQ](https://developer.themoviedb.org/docs/faq), [Registrierungsablauf](https://developer.themoviedb.org/docs/getting-started).

Die API-Bedingungen begrenzen Caching auf sechs Monate und verlangen bei Beendigung die Löschung gespeicherter Inhalte. Sie untersagen die Verletzung fremder Rechte; TMDB behauptet selbst kein Eigentum an den Bildern. Die Verfügbarkeit über die API ist daher keine pauschale Bestätigung der Rechte an jedem Poster. Unbegrenzte Mitlieferung im bestehenden statischen Offline-Paket ist damit nicht abgedeckt. [API-Bedingungen, insbesondere 1 und 4](https://www.themoviedb.org/api-terms-of-use), [rechtlicher Hinweis in der FAQ](https://developer.themoviedb.org/docs/faq).

Nach Einrichtung des Zugangs bleiben passende Poster, eindeutige Filmzuordnung, Bildnutzung und Quellenangaben zu prüfen. Zugangsdaten ausschließlich lokal in einer ignorierten Konfiguration hinterlegen; nicht in Chat, Git, Browsercode oder Veröffentlichungsartefakte übernehmen. Noch keine konkrete Zugriffsschnittstelle implementiert.

## Was das Offline-Paket bedeutet

`scripts/build-sw.mjs` erstellt die Liste der ausgelieferten App-Dateien, Fragen und Bilder. Der Service Worker speichert sie bei seiner Installation im Browser-Cache, damit das Quiz ohne Internet funktioniert. Die vorhandenen Schauspielerbilder sind darin enthalten. Externe Bildadressen werden vom bisherigen Service Worker nicht in diesen Cache aufgenommen.

Poster könnten ausschließlich online angezeigt werden. Das Offline-Paket müsste sie dann nicht enthalten; das Quiz bliebe offline spielbar, die Poster wären ohne Netz gegebenenfalls nicht verfügbar. Diese Variante benötigt weiterhin eine geeignete Bildquelle und deren Nutzungsbedingungen.

## Prüfstand

Antwortkomponente, Bildvertrag und Service-Worker-Erzeugung gelesen; keine App-Änderung und keine Bildfreigabe behauptet. Bestehende fremde Importberichtänderungen erhalten. Für die reine Klärung wurden keine App- oder Browsertests ausgeführt. Die vollständige Umsetzung und ihre Tests bleiben offen.

## Folgeentscheidung am 10.10.2026

Der Nutzer hat das Offline-Paket und dauerhafte lokale Spielstände abgewählt und zum Spielen immer eine Anmeldung verlangt. Poster brauchen daher keine Offline-Behandlung. Der eigene TMDB-Zugang fehlt weiterhin; keine Poster eingebaut. [Aktueller Betriebsvertrag](Anmeldung-und-Online-Spielstand.md).
