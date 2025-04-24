# YEP: Silent Infestation [[**3**]]

## Overview

The goal of this project is to grant more accesibility to the field of pentesting by offering a quick & customizable way to quickly gather the intelligence necessary and act upon it using industry-standard techniques such as:

- SQL Injection
- Cross-Site Scripting (XSS)
- File Upload Vulnerabilities
- Broken Authentication & Session Management

## Setup

```bash
chmod +x ./.husky/pre-commit
chmod +x ./.husky/commit-msg
```

To start the project :

```bash
cp .env.example .env # Change variables to suit yourself
cp website_next/.env.example website_next/.env # Same
docker-compose -f docker-compose.dev.yml up -d --build
docker exec -it website_silen2festation npx prisma migrate dev
```

To start storybook :

```
cd website_next
npm run storybook
```

To start swagger :

```
cd website_next
npm run swagger
```
