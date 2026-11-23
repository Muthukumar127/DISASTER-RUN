# DISASTER RUN – SURVIVE TOGETHER. ESCAPE TOGETHER.
Three.js + TypeScript (Vite) client · Node.js + Express + Socket.IO (TypeScript) server · 4-player co-op.

## Run locally
    npm install
    npm run dev          # server :3000 + Vite client :5173 (open http://localhost:5173)
    # or production-style:
    npm run build && npm start     # everything on http://localhost:3000
Same Wi-Fi / Android: open http://<PC-IP>:5173 (dev) or :3000 (prod). Microphone/secure features need https.

## Multiplayer test
Open 2–4 tabs → tab 1 "Create Room" → others "Join Room" with the 6-char code (or the ?room= invite link) → pick characters,
non-hosts press Ready, host picks map and presses Start. Typecheck: `npm run typecheck`.

## Deploy / networking
A room code only works against ONE running Node server – all players must open the same public URL. Host on any Node host (Render, Railway, Fly,
VPS): `npm run build`, start command `npm start`, PORT from env. Use https/wss (the host provides it). Self-hosting at home needs port-forwarding
(TCP 3000) + firewall rule; players behind NAT need no setup because the client connects OUT to the server (no peer-to-peer in this build).

## Status (honest)
DONE & tested (server smoke test + typecheck): private rooms, 6-char codes, 4-slot lobby, character select (MAX/NEO/COCO/REX unique), ready, host/start,
map select, disconnect + host migration, rate limiting, input validation, server-authoritative movement (speed/bounds/jump clamped), state sync.
Client written + typechecked: menu, settings, credits, third-person camera, WASD/joystick, procedural cartoon characters, name tags, placeholder desert scene.
NOT built yet (Phases 4–10): real Desert map, inventory/items, vehicle repair + driving, missions, sandstorm, escape/results, audio, GLB assets,
animation blending/clips, client-side prediction, camera collision, reconnect, maps 2–6. Nothing above is claimed beyond what is listed as DONE.

## Upload to GitHub + deploy on Render (free)
1. Create a new GitHub repo, upload ALL files from this folder (not node_modules/dist – they are git-ignored).
2. Render → New → Web Service → pick the repo. (render.yaml is read automatically.)
   Build command: `npm install --include=dev && npm run build` · Start command: `npm start`
3. Open the Render URL, share it + room code with friends.
