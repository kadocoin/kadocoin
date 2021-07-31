import fs from 'fs';
const log_err_to_file = new console.Console(fs.createWriteStream('./logs.txt'));
export default log_err_to_file;
