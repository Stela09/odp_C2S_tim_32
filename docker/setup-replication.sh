#!/bin/sh

ROOT_PASS="root1234"
REPL_USER="replicator"
REPL_PASS="repl1234"
DB_NAME="PULSE_GRID"

M="mysql  -h127.0.0.1    -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"
S1="mysql -hmysql-slave1 -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"
S2="mysql -hmysql-slave2 -P3306 -uroot -p${ROOT_PASS} --protocol=TCP --connect-timeout=5"

SCHEMA_FILE="/tmp/pulse_grid_schema.sql"

wait_mysql() {
  HOST=$1
  NAME=$2
  printf "Waiting for %s" "$NAME"
  i=0
  while [ $i -lt 30 ]; do
    mysql -h"$HOST" -P3306 -uroot -p"$ROOT_PASS" --protocol=TCP \
      --connect-timeout=3 -e "SELECT 1" > /dev/null 2>&1 \
      && echo " OK" && return 0
    printf "."
    sleep 3
    i=$((i+1))
  done
  echo " TIMEOUT"
  exit 1
}

echo "Checking node availability..."
wait_mysql "127.0.0.1" "Master"
wait_mysql "mysql-slave1" "Slave1"
wait_mysql "mysql-slave2" "Slave2"

echo "Creating schema on Master..."
$M -e "DROP DATABASE IF EXISTS ${DB_NAME};"
$M -e "CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

$M ${DB_NAME} << 'SQL'
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gamer_tag VARCHAR(40) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image TEXT NULL,
    role ENUM('player','admin') NOT NULL DEFAULT 'player',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gamer_tag (gamer_tag),
    INDEX idx_email (email)
);

CREATE TABLE games (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo TEXT NULL,
    genre VARCHAR(50),
    max_players_per_team INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE teams (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    tag VARCHAR(6) UNIQUE NOT NULL,
    logo TEXT NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tournaments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    game_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    format ENUM('single_elimination','double_elimination','round_robin') NOT NULL,
    max_teams INT UNSIGNED NOT NULL,
    registration_deadline DATETIME NOT NULL,
    starts_at DATETIME NOT NULL,
    prize_pool DECIMAL(10,2) NULL,
    status ENUM('upcoming','active','completed','cancelled') NOT NULL DEFAULT 'upcoming',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT
);

CREATE TABLE matches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT UNSIGNED NOT NULL,
    team1_id INT UNSIGNED NULL,
    team2_id INT UNSIGNED NULL,
    winner_id INT UNSIGNED NULL,
    score VARCHAR(20) DEFAULT '0:0',
    round INT UNSIGNED NOT NULL,
    status ENUM('scheduled','ongoing','completed') NOT NULL DEFAULT 'scheduled',
    scheduled_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE team_members (
    user_id INT UNSIGNED NOT NULL,
    team_id INT UNSIGNED NOT NULL,
    role ENUM('captain','member') NOT NULL DEFAULT 'member',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE match_players (
    match_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    team_id INT UNSIGNED NOT NULL,
    performance_notes TEXT NULL,
    PRIMARY KEY (match_id, user_id),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE tournament_registrations (
    team_id INT UNSIGNED NOT NULL,
    tournament_id INT UNSIGNED NOT NULL,
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending','confirmed','disqualified') NOT NULL DEFAULT 'pending',
    seed INT NULL,
    PRIMARY KEY (team_id, tournament_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE user_watchlist (
    user_id INT UNSIGNED NOT NULL,
    tournament_id INT UNSIGNED NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tournament_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT IGNORE INTO games (id, name, logo, genre, max_players_per_team) VALUES
(1, 'League of Legends', NULL, 'MOBA', 5),
(2, 'Valorant', NULL, 'FPS', 5),
(3, 'CS2', NULL, 'FPS', 5),
(4, 'Dota 2', NULL, 'MOBA', 5);
SQL

MASTER_TABLES=$($M -s --skip-column-names \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" 2>/dev/null)

echo "Master tables: ${MASTER_TABLES}"

echo "Locking Master and dumping schema..."
$M -e "FLUSH TABLES WITH READ LOCK;" > /dev/null 2>&1

STATUS=$($M --skip-column-names -e "SHOW MASTER STATUS;" 2>/dev/null)
BINLOG_FILE=$(echo "$STATUS" | awk '{print $1}')
BINLOG_POS=$(echo "$STATUS" | awk '{print $2}')

mysqldump -h127.0.0.1 -P3306 -uroot -p"${ROOT_PASS}" --protocol=TCP \
  --skip-lock-tables --no-tablespaces \
  ${DB_NAME} > "$SCHEMA_FILE" 2>/dev/null

$M -e "UNLOCK TABLES;" > /dev/null 2>&1

echo "Importing schema into Slave1..."
$S1 -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$S1 ${DB_NAME} < "$SCHEMA_FILE"

printf "STOP REPLICA;\nRESET REPLICA ALL;\nCHANGE REPLICATION SOURCE TO SOURCE_HOST='mysql-master', SOURCE_PORT=3306, SOURCE_USER='%s', SOURCE_PASSWORD='%s', SOURCE_LOG_FILE='%s', SOURCE_LOG_POS=%s, GET_SOURCE_PUBLIC_KEY=1;\nSTART REPLICA;\n" \
  "$REPL_USER" "$REPL_PASS" "$BINLOG_FILE" "$BINLOG_POS" | $S1

echo "Importing schema into Slave2..."
$S2 -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$S2 ${DB_NAME} < "$SCHEMA_FILE"

printf "STOP REPLICA;\nRESET REPLICA ALL;\nCHANGE REPLICATION SOURCE TO SOURCE_HOST='mysql-master', SOURCE_PORT=3306, SOURCE_USER='%s', SOURCE_PASSWORD='%s', SOURCE_LOG_FILE='%s', SOURCE_LOG_POS=%s, GET_SOURCE_PUBLIC_KEY=1;\nSTART REPLICA;\n" \
  "$REPL_USER" "$REPL_PASS" "$BINLOG_FILE" "$BINLOG_POS" | $S2

rm -f "$SCHEMA_FILE"

echo "Replication setup done."
