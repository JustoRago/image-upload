<div align="center">
  <img src="./src/assets/doctors Icon.png" alt="logo" width="140"  height="auto" />
  <br/>

  <h3><b>Image Storage App</b></h3>

</div>
## Table of Contents

- [📖 About the Project](#about-project)
  - [🛠 Built With](#built-with)
    - [Tech Stack](#tech-stack)
    - [Key Features](#key-features)
  - [🚀 Live Demo](#live-demo)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)



<!-- PROJECT DESCRIPTION -->

# 📖 Doctors Reservations Front-end <a name="about-project"></a>


**Image-Storage-App** allows user to sign up, and log in. When logged in may create categories, public or private, and place images within those categories.

## 🛠 Built With <a name="built-with"></a>

### Tech Stack <a name="tech-stack"></a>


<details>
  <summary>Client</summary>
  <ul>
    <li><a href="https://reactjs.org/">React.js</a></li>
  </ul>
</details>

<details>
  <summary>Server</summary>
  <ul>
    <li><a href="https://expressjs.com/">Express.js</a></li>
  </ul>
</details>

<details>
<summary>Database</summary>
  <ul>
    <li><a href="https://www.postgresql.org/">PostgreSQL</a></li>
  </ul>
</details>

<!-- Features -->

### Key Features <a name="key-features"></a>


- **Sign up and login system.**
- **Creation of public or private categories and authorization.**
- **Uploading of images.**
- **Searching images.**
- **Rename or delete images, edit and delete categories.**
- **Change password and delete account.**

<!-- LIVE DEMO -->

## 🚀 Live Demo <a name="live-demo"></a>

[Live Demo here.](https://deployment--tiny-sunburst-e4134c.netlify.app)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Installation

Organized as effectively two separate projects stored in one repository. Server packages and Client packages must be installed separately.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Client and server must also be started separately. Use http://127.0.0.1:3000/ when running locally to avoid CORS problems.

On first start the server seeds a default user so a fresh database is immediately usable:

- username: `asdt560`
- password: `justojose1`

The seed only runs when `NODE_ENV` is not `production` and skips the user if it already exists. Override the credentials with the `SEED_USERNAME`, `SEED_PASSWORD` and `SEED_EMAIL` environment variables (see [server/.env.example](server/.env.example)).

To also seed a few example categories and images, run the idempotent seed script from the `server/` folder (safe to re-run — nothing already present is recreated or overwritten):

```sh
npm run seed
```

It seeds the default user plus the `Nature`, `Food` and `Technology` categories with placeholder images, and works on the database the server connects to.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## API overview

All endpoints are under `http://localhost:5000/api/v1` and use a session cookie for authentication (`credentials: 'include'` on the client).

| Endpoint | Description |
| --- | --- |
| `POST /users/signup`, `POST /users/login`, `DELETE /users/logout` | Accounts and sessions. |
| `GET /users` | Returns the logged-in user. |
| `PATCH /users/password` | Change the password (body: `current_password`, `new_password`). |
| `DELETE /users/account` | Delete the account and its data (blocked while its categories still contain images). |
| `GET /categories`, `GET /categories/:id` | List/view categories. Anonymous users only see public ones. |
| `POST /categories` | Create a category (body: `category`, `privacy`). |
| `PATCH /categories/:id` | Rename and/or toggle privacy of an owned category. |
| `DELETE /categories/:id` | Delete an owned, empty category. |
| `GET /images`, `GET /images/:categoryId` | List, search (`?search=`), random (`?random=true`) and per-category images. |
| `POST /images` | Upload an image (multipart: `img_name`, `category`, `files`). Only PNG, JPEG, GIF and WebP up to 10 MB are accepted — content is validated by magic bytes, not the client MIME type. |
| `PATCH /images/:id` | Rename one of your images (body: `img_name`). |
| `DELETE /images/:id` | Delete one of your images (row and file). |

### Category name uniqueness

- **Public category names** share one global namespace — no two public categories may have the same name.
- **Private category names** only need to be unique within the owning user's private categories — a private category may share its name with public categories or with other users' private categories.

Duplicates are rejected with `409` both by the route and by database indexes (`categories_public_name_unique`, `categories_private_name_unique`) that are created on startup, so concurrent requests cannot slip through.

### Security hardening

- `helmet` security headers and login/signup **rate limiting** (30 attempts / 15 minutes per IP).
- **Session fixation** is prevented: a fresh session id is generated on login.
- Uploads are capped at **10 MB**, restricted to real image formats via **magic-byte sniffing**, and filenames are sanitized against path traversal.
- Usernames/passwords/images/category names are length-limited via `express-validator`.
- Usernames are globally unique — a database index backs up the signup check.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Testing

The server test suite (`npm test` in `server/`) never touches your development data. It runs against its own database and its own temporary upload folder:

- **Dedicated database** — `<your DB name>_test` (e.g. `imagestore_test`). A Jest `globalSetup` creates it on first run and drops/recreates its schema before every run, so tests always start from a clean slate; the development database is never modified.
- **Separate upload folder** — uploads made by tests go to a temporary directory that is wiped after the run, so your real `imagefolder/` is untouched.
- **Serial execution** (`maxWorkers: 1`) — suites are run one at a time because each test file initializes the schema, and parallel creation of the same tables/indexes is not atomic.
- The app awaits database initialization before serving, and closes its connection pool at the end of each suite so the run terminates cleanly.

Requirements: the Postgres role must be able to create databases (or `imagestore_test` must already exist and be owned by the role). Point the suite at a different database with `TEST_DBNAME` if you want an explicit name.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

This project is [MIT](./LICENSE) licensed.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
