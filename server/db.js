import 'dotenv/config'
import pgPromise from 'pg-promise';

const pgp = pgPromise();


const cn = {
  user: process.env.DBUSER,
  password: process.env.DBPASS,
  host: process.env.DBHOST,
  port: process.env.DBPORT || process.env.PORT,
  database: process.env.DBNAME,
};

const pg = pgp(cn)

export default pg;