# Pulse Grid

Pulse Grid je aplikacija za organizaciju esports turnira, timova, prijava, rasporeda meceva, watchlist-a, health pregleda i audit loga.

## Tehnologije

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Baza: MySQL master + 2 slave cvora preko Docker-a
- Auth: JWT + bcrypt
- Role: `player` i `admin`

## Pokretanje

Sve komande se pokrecu iz glavnog foldera projekta.

### 1. Baza

```powershell
docker compose down -v
docker compose up -d --build
```

Sacekati 20-30 sekundi, pa pokrenuti:

```powershell
docker cp docker/setup-replication.sh project_master:/setup.sh
docker exec project_master sh /setup.sh
```

Provera tabela:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "SHOW TABLES;"
```

Bitne tabele:

```txt
users
games
teams
team_members
tournaments
tournament_registrations
matches
match_players
user_watchlist
audit_logs
```

### 2. Backend

```powershell
cd server
npm install
npm run dev
```

Backend radi na:

```txt
http://localhost:4000/api/v1
```

### 3. Frontend

```powershell
cd client
npm install
npm run dev
```

Frontend radi na:

```txt
http://localhost:5173
```

## Test korisnik

Ako baza nema korisnika, napravi korisnika:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/v1/auth/register" -Method POST -ContentType "application/json" -Body '{"gamer_tag":"admin1","full_name":"Admin Test","email":"admin1@gmail.com","password":"Admin1234"}'
```

Postavi ga kao admina:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "UPDATE users SET role='admin' WHERE gamer_tag='admin1';"
```

Login:

```txt
Gamer tag: admin1
Lozinka: Admin1234
```


## Distribuirani deo

- Pisanje ide na MySQL master.
- Citanje ide preko `getReadConnection()` na zdrave slave cvorove round-robin logikom.
- Ako slave cvorovi nisu dostupni, citanje pada nazad na master.
- Health check periodocno proverava master i oba slave cvora.

## Korisne provere

Provera prijava:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "SELECT * FROM tournament_registrations;"
```

Provera meceva:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "SELECT * FROM matches;"
```

Provera audit loga:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "SELECT action, entity_type, entity_id, created_at FROM audit_logs ORDER BY id DESC LIMIT 20;"
```

## Napomena

Ako se pokrene `docker compose down -v`, brise se cela baza. Posle toga treba ponovo pokrenuti `setup-replication.sh`, registrovati korisnika i po potrebi ga postaviti kao admina.

