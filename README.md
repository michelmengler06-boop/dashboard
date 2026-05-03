# Life OS Plus

Dashboard lifestyle per iPhone in formato PWA: può essere caricata su GitHub Pages e installata da Safari con **Condividi → Aggiungi alla schermata Home**.

## File

- `index.html` — struttura dell'app.
- `styles.css` — grafica, layout responsive, stile iPhone/app.
- `app.js` — logica della dashboard e salvataggio dati.
- `manifest.json` — impostazioni PWA.
- `sw.js` — cache offline.
- `icon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png` — icone.

## Funzioni principali

- Hub con XP, livelli, energia, focus e daily quest.
- Studio: Kanban, Pomodoro, voti CH.
- Abitudini: streak e heatmap 35 giorni.
- Food/Health: acqua, sonno, passi, mood, diario pasti con calorie/proteine/note.
- Gym: allenamenti con nome, esercizi, set, kg, reps, template e storico sessioni.
- Money: spese mensili, mini-grafico, obiettivo risparmio.
- Agenda: eventi, obiettivi e backup JSON.

## Backup

I dati sono salvati in `localStorage`, quindi restano nel browser/dispositivo. Usa spesso **Export** per scaricare un backup JSON.
