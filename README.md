# Planetary Health QuizDuell

Willkommen beim Planetary Health QuizDuell! Dieses Projekt ist eine Full-Stack-Webanwendung, die es Benutzern ermöglicht, ihr Wissen über planetare Gesundheit in spannenden Quiz-Duellen zu testen und zu erweitern.

## Inhaltsverzeichnis

- [Projektübersicht](#projektübersicht)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Datenbank](#datenbank)
- [Technologie-Stack](#technologie-stack)
- [Voraussetzungen](#voraussetzungen)
- [Einrichtung und Start](#einrichtung-und-start)
  - [1. Klonen des Repositories](#1-klonen-des-repositories)
  - [2. Umgebungsvariablen konfigurieren](#2-umgebungsvariablen-konfigurieren)
    - [Root `.env`-Datei](#root-env-datei)
    - [Backend `.env`-Datei](#backend-env-datei)
    - [Frontend `.env.local`-Datei](#frontend-envlocal-datei)
  - [3. Anwendung mit Docker Compose starten](#3-anwendung-mit-docker-compose-starten)
  - [4. Datenbank initialisieren (Seed)](#4-datenbank-initialisieren-seed)
- [Zugriff auf die Anwendung](#zugriff-auf-die-anwendung)
  - [Initialer Admin-Account](#initialer-admin-account)
- [Lokale Entwicklung (ohne Docker für einzelne Services)](#lokale-entwicklung-ohne-docker-für-einzelne-services)
- [Wichtige Umgebungsvariablen](#wichtige-umgebungsvariablen)

## Projektübersicht

Das Projekt besteht aus drei Hauptkomponenten:

### Frontend

Eine Next.js-Anwendung, die das User Interface für das Quiz, die Benutzerverwaltung und das Admin-Panel bereitstellt.

### Backend

Eine Node.js/Express-API mit TypeScript, die die Geschäftslogik, Benutzerauthentifizierung, Spielmechanik und Datenbankinteraktionen über Prisma ORM verwaltet.

### Datenbank

Eine PostgreSQL-Datenbank zur Speicherung von Benutzerdaten, Fragen, Spielen und anderen relevanten Informationen.

## Technologie-Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Axios, react-hot-toast
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, bcryptjs, jsonwebtoken
- **Datenbank**: PostgreSQL
- **Containerisierung**: Docker, Docker Compose
- **Linting/Formatting**: ESLint, Prettier

## Voraussetzungen

- Docker und Docker Compose müssen installiert sein. ([Anleitung](https://docs.docker.com/get-docker/))
- Git für das Klonen des Repositories.
- Node.js und npm/yarn (optional, für lokale Entwicklung außerhalb von Docker).

## Einrichtung und Start

### 1. Klonen des Repositories

```bash
git clone <repository-url>
cd quizduell-planetary-health
```

### 2. Umgebungsvariablen konfigurieren

Das Projekt verwendet `.env`-Dateien zur Konfiguration von Umgebungsvariablen. Beispielvorlagen (`.env.example`) sind im Projekt enthalten.

#### Root `.env`-Datei

Diese Datei wird von `docker-compose.yml` verwendet, um Variablen zu substituieren, z.B. für Port-Mappings.

1.  Kopieren Sie die Vorlage:
    ```bash
    cp .env.example .env
    ```
2.  Passen Sie bei Bedarf den `POSTGRES_HOST_PORT` in der `.env`-Datei an, wenn der Standardport `5432` auf Ihrem Host bereits belegt ist.

#### Backend `.env`-Datei

Diese Datei wird vom Backend-Service benötigt, insbesondere wenn Sie das Backend lokal (außerhalb von Docker) entwickeln möchten. Die `docker-compose.yml` setzt die meisten dieser Variablen direkt für den Docker-Container.

1.  Kopieren Sie die Vorlage in das `backend`-Verzeichnis:
    ```bash
    cp backend/.env.example backend/.env
    ```
2.  Überprüfen und passen Sie die Werte in `backend/.env` an, insbesondere `JWT_SECRET` für die lokale Entwicklung. Für den Docker-Betrieb werden die Werte aus `docker-compose.yml` verwendet.

#### Frontend `.env.local`-Datei

Diese Datei wird vom Frontend-Service benötigt, insbesondere für die lokale Entwicklung.

1.  Kopieren Sie die Vorlage in das `frontend`-Verzeichnis:
    ```bash
    cp frontend/.env.local.example frontend/.env.local
    ```
2.  Die Standardwerte für `NEXT_PUBLIC_API_URL` und `NEXT_PUBLIC_SOCKET_URL` sollten für den Docker-Betrieb und die lokale Entwicklung mit dem Backend auf Port `5001` passen.

### 3. Anwendung mit Docker Compose starten

Dieser Befehl baut die Docker-Images für Frontend und Backend und startet alle Dienste (Frontend, Backend, Datenbank).

```bash
docker-compose up --build
```

Beim ersten Start kann der Build-Prozess einige Minuten dauern. Nach erfolgreichem Start läuft:

- Das Frontend auf `http://localhost:3000`
- Das Backend auf `http://localhost:5001`
- Die PostgreSQL-Datenbank auf dem Host-Port, der in Ihrer root `.env`-Datei (Standard: `5432`) oder direkt in `docker-compose.yml` definiert ist.

### 4. Datenbank initialisieren (Seed)

Nachdem die Container gestartet sind und die Datenbank bereit ist (die Healthcheck-Bedingung in `docker-compose.yml` stellt dies sicher), wird das Backend automatisch versuchen, die Datenbank mit initialen Daten (Admin-Benutzer, Beispielfragen) zu befüllen. Dies geschieht durch das Prisma-Seed-Skript, das beim Start des Backend-Containers ausgeführt wird (siehe `Dockerfile.backend` und `package.json`-Skripte im Backend).

Falls Sie die Datenbank manuell seeden müssen oder wollen, können Sie dies tun, während die Container laufen:

```bash
docker-compose exec backend npm run seed
```

## Zugriff auf die Anwendung

- **Frontend**: Öffnen Sie `http://localhost:3000` in Ihrem Browser.
- **Backend API**: Ist unter `http://localhost:5001/api` erreichbar.

### Initialer Admin-Account

Durch das Seeding-Skript wird ein initialer Admin-Account erstellt. Die Zugangsdaten hierfür werden über Umgebungsvariablen in der `docker-compose.yml` Datei festgelegt:

- **Email**: `INITIAL_ADMIN_EMAIL` (Standard: `admin@example.com`)
- **Passwort**: `INITIAL_ADMIN_PASSWORD` (Standard: `SecurePassword123!`)

Sie können sich mit diesen Daten einloggen und haben Zugriff auf den Admin-Bereich zur Fragenverwaltung.

## Lokale Entwicklung (ohne Docker für einzelne Services)

Wenn Sie einzelne Services (z.B. das Frontend) lokal entwickeln möchten, während andere (z.B. Backend und DB) in Docker laufen:

1.  Stellen Sie sicher, dass die Docker-Container für Backend und Datenbank laufen (`docker-compose up -d backend postgres_db`).
2.  Konfigurieren Sie die entsprechenden `.env` bzw. `.env.local` Dateien in den `frontend` und/oder `backend` Verzeichnissen, sodass sie auf die laufenden Docker-Dienste zeigen (z.B. `DATABASE_URL` im Backend auf `localhost` mit dem gemappten Port der Docker-DB).
3.  Starten Sie den gewünschten Service lokal (z.B. `npm run dev` im `frontend`-Verzeichnis).

## Wichtige Umgebungsvariablen

- `DATABASE_URL`: Verbindungsstring zur PostgreSQL-Datenbank.
  - Im Docker-Backend-Container: `postgresql://postgres:postgres@postgres_db:5432/quizduell_db?schema=public` (verwendet den Service-Namen `postgres_db`).
  - Für lokale Backend-Entwicklung (Verbindung zur Docker-DB): `postgresql://postgres:postgres@localhost:5432/quizduell_db?schema=public` (oder der von Ihnen konfigurierte `POSTGRES_HOST_PORT`).
- `JWT_SECRET`: Geheimer Schlüssel zur Signierung von JSON Web Tokens. **Wichtig: Für Produktionsumgebungen einen starken, zufälligen Wert verwenden!**
- `NEXT_PUBLIC_API_URL`: URL des Backend-Servers, die vom Frontend verwendet wird.
- `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_UNIHANDLE`: Zugangsdaten für den initialen Admin-Benutzer, der beim Seeding erstellt wird. Diese werden primär aus der `docker-compose.yml` für den Backend-Container bezogen.
- `POSTGRES_HOST_PORT`: Der Host-Port, auf den der PostgreSQL-Docker-Container gemappt wird (Standard: `5432`).
- `FRONTEND_URL`: Die Basis-URL der Frontend-Anwendung, wird vom Backend z.B. für Passwort-Reset-Links verwendet.

Bei Fragen oder Problemen, überprüfen Sie die Logs der Docker-Container:

```bash
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres_db
```
