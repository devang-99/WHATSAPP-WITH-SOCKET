/* eslint-disable prettier/prettier */

import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const rawDataSourceOptions = {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: false,
     entities: ['dist/**/*.entity.js'],
     migrations: ['dist/database/migrations/*.js'],
};

export const dataSourceOptions = rawDataSourceOptions as DataSourceOptions;
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;