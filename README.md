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

## License

This project is [MIT](./LICENSE) licensed.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
