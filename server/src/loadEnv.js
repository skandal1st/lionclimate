import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// override: true — чтобы значения из server/.env перекрывали переменные из systemd
// (иначе systemd EnvironmentFile может подставить испорченный ADMIN_PASSWORD_HASH: символы $ в bcrypt)
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
