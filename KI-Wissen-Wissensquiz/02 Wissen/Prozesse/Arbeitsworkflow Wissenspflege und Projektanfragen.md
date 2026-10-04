# Arbeitsworkflow Wissenspflege und Projektanfragen

1. Projektfragen zuerst aus der aktuellen Fachseite oder dem Index beantworten; bei unbekanntem Kontext den Projektstart lesen.
2. Bei Codeänderungen aktuelle Implementierung, betroffene Verträge und passende Checks direkt prüfen.
3. Quellen bei Wissenslücken oder Verifikationsbedarf nachziehen; neue dauerhafte Projektquellen unverändert ablegen und vollständig auswerten.
4. Belastbare Erkenntnisse auf passenden Fachseiten pflegen; Quellen, Annahmen, Unsicherheit und Widersprüche kenntlich machen.
5. Navigation bei neuen Seiten ergänzen; Log nur für wesentliche Entwicklungen, Entscheidungen, Risiken und Abschlussstände erweitern.
6. Links, Inhalt, Git-Diff und private Ausschlüsse prüfen. Technische Tests passend zur Implementierung ausführen.
7. Im bestehenden Arbeitsordner standardmäßig direkt auf `main` arbeiten. Abgeschlossene, passend geprüfte Änderungsblöcke selbstständig mit kurzer, aussagekräftiger Commit-Nachricht lokal committen; fremde oder unfertige Änderungen erhalten. Neue Worktrees nur auf ausdrücklichen Nutzerauftrag anlegen. Bei größeren, umfassenden Änderungen einen Worktree vorschlagen und vor seiner Anlage nachfragen. Push und Veröffentlichung bleiben gesondert zu beauftragen.
8. Korrekturen in dieser Entwicklungsphase direkt und möglichst einfach ausführen. Neue oder erweiterte Kompatibilitätsmaßnahmen für Altstände, historische Daten oder frühere Versionen vor der Umsetzung ausdrücklich vom Nutzer genehmigen lassen; keine Migrationen, Adapter, Fallbacks oder historischen Sonderfälle aus einer gewöhnlichen Korrektur ableiten.

Globale Standards werden über die lokale Auflösung in `AGENTS.local.md` gefunden. Ohne diese Datei gelten die commitbaren Projektanweisungen weiter.
