Da, README je još template. Zameni ceo `README.md` ovim:

```md
# Pulse Grid

Pulse Grid je full-stack aplikacija za upravljanje esport turnirima, timovima, watchlist-om i admin pregledima.

## Tehnologije

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Baza: MySQL master + 2 slave čvora preko Docker-a
- Auth: JWT + bcrypt
- Role: `player` i `admin`

## Struktura projekta

```txt
client/                 React frontend
server/                 Express backend
docker/                 Docker konfiguracija za MySQL master/slave
DB_Upiti.sql            SQL šema baze
docker-compose.yml      Docker compose konfiguracija
```

## Pokretanje od nule

Sve komande se pokreću iz glavnog foldera projekta.

### 1. Resetuj i pokreni Docker bazu

```powershell
docker compose down -v
docker compose up -d --build
```

Sačekati 20-30 sekundi da se MySQL čvorovi podignu.

### 2. Pokreni setup replikacije i šeme

```powershell
docker cp docker/setup-replication.sh project_master:/setup.sh
docker exec project_master sh /setup.sh
```

Provera tabela:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "SHOW TABLES;"
```

Očekivane tabele:

```txt
audit_logs
games
matches
team_members
teams
tournament_registrations
tournaments
user_watchlist
users
```

### 3. Pokreni backend

U prvom terminalu:

```powershell
cd server
npm install
npm run dev
```

Backend radi na:

```txt
http://localhost:4000/api/v1
```

### 4. Pokreni frontend

U drugom terminalu:

```powershell
cd client
npm install
npm run dev
```

Frontend radi na:

```txt
http://localhost:5173
```

## .env za server

U `server/.env` treba da stoji:

```env
DB_MASTER_HOST=localhost
DB_MASTER_PORT=3306
DB_MASTER_USER=root
DB_MASTER_PASSWORD=root1234
DB_MASTER_NAME=PULSE_GRID

DB_SLAVE1_HOST=localhost
DB_SLAVE1_PORT=3307
DB_SLAVE1_USER=root
DB_SLAVE1_PASSWORD=root1234
DB_SLAVE1_NAME=PULSE_GRID

DB_SLAVE2_HOST=localhost
DB_SLAVE2_PORT=3308
DB_SLAVE2_USER=root
DB_SLAVE2_PASSWORD=root1234
DB_SLAVE2_NAME=PULSE_GRID

PORT=4000
CLIENT_URL=http://localhost:5173

JWT_SECRET=project__is_a_great_one_i_guess
SALT_ROUNDS=10
HEALTH_CHECK_INTERVAL=10000
```

## Test korisnika

Posle resetovanja baze nema korisnika. Prvo se registruje novi korisnik kroz frontend ili API.

Primer preko API-ja:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/v1/auth/register" -Method POST -ContentType "application/json" -Body '{"gamer_tag":"admin1","full_name":"Admin Test","email":"admin1@gmail.com","password":"Admin1234"}'
```

Da bi korisnik postao admin:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "UPDATE users SET role='admin' WHERE gamer_tag='admin1';"
```

Login podaci:

```txt
Gamer tag: admin1
Lozinka: Admin1234
```

## Osnovni tok za proveru

1. Registruj korisnika.
2. Postavi korisnika kao admina.
3. Uloguj se na frontend.
4. Kreiraj turnir kroz admin stranicu.
5. Kreiraj tim kroz timovi stranicu.
6. Prijavi tim na turnir.
7. Dodaj turnir na watchlist.
8. Proveri health stranicu.

## Korisne provere

Provera turnira kroz API:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/v1/tournaments" -Method GET
```

Provera prijavljenih timova:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "SELECT * FROM tournament_registrations;"
```

Provera korisnika:

```powershell
docker exec -i project_master mysql -uroot -proot1234 PULSE_GRID -e "SELECT id, gamer_tag, email, role FROM users;"
```

## Napomena

Ako se radi `docker compose down -v`, briše se cela baza i svi korisnici. Nakon toga treba ponovo pokrenuti `setup-replication.sh`, registrovati korisnika i po potrebi ga postaviti kao admina.
```

