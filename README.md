# shortosaur

## Overview

Shortosaur is a simple URL shortening app.

Down to the tech! It is comprised of;

- A mini vanilla JS webapp on `/app`,
- an express js server as an API,
- and it uses MongoDB!

## Dependencies

- NodeJS/NPM
- Docker (Optional)

## Quick Start

### Local Dev or a server

1. Clone the repo.

2. Do an `npm i`.

3. Setup your MongoDB instance and user.

Something simple like this will do;

```
use shortosaur;

db.createUser({ user: "shortosaur", pwd: passwordPrompt(), roles: ["readWrite"] });
```

4. `cp .env.example .env` and fill this in, you can ignore or delete the docker config.

5. Run `npm run dev` for a nodemon process to do local dev or setup a process watcher for `npm run start` on a server

### For Docker

1. Clone the repo.

2. Do an `npm i`.

3. Do a `cp .env.example .env`, the DockerFile will copy this in as `.env`.

4. Fill in the `.env`, making sure that the docker config and app config match.

5. Do run docker compose as you usually do, something like so `docker compose up --build -d`.
