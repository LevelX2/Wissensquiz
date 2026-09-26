# Qualitätsprüfung

## Prüfungen der Projektgrundstruktur

- Mindeststruktur und relative Markdown-Verweise prüfen.
- `git diff --check` vor dem Commit ausführen.
- Mit `git check-ignore AGENTS.local.md .env .venv data node_modules dist` die lokalen Ausschlüsse prüfen.
- Nach dem Commit sauberen Git-Status und fehlende Remotes verifizieren.

## Grenzen

Anwendung, Technologie-Stack und Laufzeitverhalten sind noch nicht definiert. Es gibt daher noch keine Build- oder Anwendungstests. Mit der ersten Implementierung sinnvolle Prüf- und Startbefehle dokumentieren.
