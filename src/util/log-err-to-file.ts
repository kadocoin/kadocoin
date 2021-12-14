import fs from 'fs';
import { ENVIRONMENT } from '../config/secret';

let log_err_to_file: Console = null;

if (ENVIRONMENT !== 'production') {
  log_err_to_file = new console.Console(fs.createWriteStream('./logs.txt'));
}
export default log_err_to_file;
