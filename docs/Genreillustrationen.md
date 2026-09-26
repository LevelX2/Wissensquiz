# Genreillustrationen

Erzeugt am 26.09.2026 mit dem eingebauten Bildgenerierungswerkzeug (`image_gen`), ohne externen API-Schlüssel. Sieben eigene PNG-Illustrationen unter `public/genres/`, echte RGBA-Transparenz. Die generierten Originale wurden unverändert übernommen. Genrekarten, filmbezogene Sammlungskarten und kleine Genre-Auswahlfelder verwenden dieselben Illustrationen. Kleine Bilder werden mit 40 Pixeln angezeigt und aus denselben vorhandenen Dateien geladen; keine zusätzlichen Motive oder Downloads je Film. Filme mit Fragen aus mehreren Genres zeigen alle zugehörigen Motive. Ohne bekanntes Motiv bleibt das kontrastreiche SVG erhalten.

## Prompts

### scifi

Datei: `public/genres/scifi.png`

```text
Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 100px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object. Subject: A compact retro-futuristic ivory and teal rocket with a warm golden exhaust, angled slightly upward to the right.
```

### action

Datei: `public/genres/action.png`

```text
Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 100px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object. Subject: A dynamic thick beveled golden lightning bolt, luminous orange enamel edges and two small tapered metallic motion accents. Exciting, powerful and immediately recognizable.
```

### horror

Datei: `public/genres/horror.png`

```text
Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 100px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object. Subject: An elegant friendly-spooky floating ivory ghost with flowing sculpted folds and dark expressive eye cutouts, subtle lavender rim accents. No gore, no text.
```

### fantasy

Datei: `public/genres/fantasy.png`

```text
Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 100px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object. Subject: A graceful deep violet wizard hat with warm gold star inlays, a short ivory-and-gold magic wand crossing in front with one luminous gold four-point spark. Cohesive single compact object group.
```

### comedy

Datei: `public/genres/comedy.png`

```text
Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 100px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object. Subject: One joyful laughing theatrical mask in warm golden enamel and ivory, expressive raised eyebrows and smiling mouth, a tiny teal ribbon accent.
```

### western

Datei: `public/genres/western.png`

```text
Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 100px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object. Subject: A sculpted warm ivory-and-sand cowboy hat with curved brim, dark caramel leather band and a small gold sheriff-star ornament.
```

### drama

Datei: `public/genres/drama.png`

```text
Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 100px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object. Subject: One thoughtful dramatic theatrical mask in bright porcelain ivory, sculpted expressive brows and a subtle melancholic mouth, with a burgundy-and-gold ribbon accent. Elegant, dignified, clearly distinct from a laughing comedy mask.
```


## Erweiterung mit Classics

Vier weitere freigestellte PNG-Originale am 26.09.2026 mit image_gen erzeugt und unverändert ins Projekt kopiert: Abenteuer (Kompass mit Karte), Musik (Mikrofon mit Note), Thriller (Auge im Schlüsselloch) und Classics (Projektor). Alle 1254 × 1254 px, RGBA mit transparenter Ecke; Originale visuell geprüft. Die vorhandenen sieben Bilder bleiben unverändert. Auch Stufenfortschritte verwenden nun diese gemeinsamen Bilder. Auf schmalen Auswahlfeldern 32 px, sonst kleine Motive 40 px.

Gemeinsamer Prompt:

Use case: stylized-concept. Create ONE premium freestanding genre icon for a film trivia web app. Square 1024px composition, object centered fills 78% with safe margins. Beautiful tactile 3D illustration, sculpted enamel and brushed metal, softly rounded edges, restrained elegant cinematic style for adults. Bright ivory and warm gold highlights, rich selective accent color, strong legible silhouette even at 40px. Soft upper-left studio key light, subtle self-shadow only. ACTUAL TRANSPARENT BACKGROUND with clean alpha, not a white background, not a checkerboard. No text, letters, watermark, border, circular badge, scenery, base or cast shadow outside the object.

Motivzusätze:

- adventure.png: An antique golden compass with ivory face and a teal compass needle, tilted slightly, with a small folded parchment map tucked behind. No letters or numbers.
- music.png: One vintage ivory and gold studio microphone with a single large teal musical eighth note beside it, cohesive compact object group.
- thriller.png: A polished ivory keyhole silhouette containing a single expressive teal eye, warm golden beveled border, elegant suspense motif, simple and legible.
- classics.png: One elegant vintage ivory and golden cinema projector with two reels, restrained burgundy accents, timeless classic cinema, one freestanding compact object.

## Martial Arts & Asia-Film, Rom-Com und Arthouse

Am 26.09.2026 mit dem integrierten image_gen erzeugt, drei getrennte Originale ohne Wiederholungen. Je 1254 × 1254 px, RGBA, echte Transparenz pixelweise geprüft und Motive visuell geprüft. Unverändert in public/genres/martialarts.png, romcom.png und arthouse.png kopiert. Bisherige Bilder unverändert.

### martial-arts

```text
Use case: stylized-concept. Asset type: premium film-genre UI icon, square transparent PNG. Style: sculptural 3D illustrated collectible, polished warm ivory enamel and lustrous brushed gold bevels, richly shaded burgundy/teal accents, softly lit studio render, refined handcrafted luxury miniature. Match the established ivory-and-gold cinema projector and ivory/gold comedy mask reference style visible in the conversation. Composition: one unified centered icon, full silhouette visible with generous 10% transparent padding, readable at 40px on a light background, strong simple forms. Background: genuinely transparent alpha, no background color, no checkerboard, no floor. Constraints: no text, letters, logos, watermark, frame or extra objects.
Subject: Martial Arts & Asia-Film represented by an elegant dynamic martial artist miniature mid-kick, stylized non-identifiable human sculpture in warm ivory outfit with gold trim and a rich burgundy flowing sash; balanced diagonal pose with a clear readable kicking silhouette, artistic martial-arts cinema energy.
```

### rom-com

```text
Use case: stylized-concept. Asset type: premium film-genre UI icon, square transparent PNG. Style: sculptural 3D illustrated collectible, polished warm ivory enamel and lustrous brushed gold bevels, richly shaded burgundy/teal accents, softly lit studio render, refined handcrafted luxury miniature. Match the established ivory-and-gold cinema projector and ivory/gold comedy mask reference style visible in the conversation. Composition: one unified centered icon, full silhouette visible with generous 10% transparent padding, readable at 40px on a light background, strong simple forms. Background: genuinely transparent alpha, no background color, no checkerboard, no floor. Constraints: no text, letters, logos, watermark, frame or extra objects.
Subject: Rom-Com represented by exactly two interlocking sculpted hearts, one warm coral enamel and one rich burgundy enamel, gold beveled edges, with a single tasteful curled gold filmstrip wrapping softly around their base. Romantic and playful, polished unified sculptural icon.
```

### arthouse

```text
Use case: stylized-concept. Asset type: premium film-genre UI icon, square transparent PNG. Style: sculptural 3D illustrated collectible, polished warm ivory enamel and lustrous brushed gold bevels, richly shaded burgundy/teal accents, softly lit studio render, refined handcrafted luxury miniature. Match the established ivory-and-gold cinema projector and ivory/gold comedy mask reference style visible in the conversation. Composition: one unified centered icon, full silhouette visible with generous 10% transparent padding, readable at 40px on a light background, strong simple forms. Background: genuinely transparent alpha, no background color, no checkerboard, no floor. Constraints: no text, letters, logos, watermark, frame or extra objects.
Subject: Arthouse cinema represented by a surreal sculptural motif combining one single stylized ivory eye with a deep teal iris and gold rim, and a gently curled gold-and-teal film strip passing beneath and around the eye. Artistic auteur cinema, elegant sculptural surrealism, simple cohesive silhouette.
```
