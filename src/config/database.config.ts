import { registerAs } from '@nestjs/config';
import * as fs from 'fs';

export default registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.DB_SYNC,
  ssl:
    process.env.DB_SSL === 'true'
      ? { ca: fs.readFileSync('src/config/global-bundle.pem').toString() }
      : false,
}));
