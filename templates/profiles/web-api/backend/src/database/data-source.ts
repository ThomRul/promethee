import 'reflect-metadata';
import { DataSource } from 'typeorm';
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'project',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'project',
  synchronize: false,
  entities: [],
  migrations: [],
});
