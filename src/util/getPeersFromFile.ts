import fs from 'fs';

export default function getPeersFromFile(peersStorageFile: string): Promise<(string | Buffer)[]> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(peersStorageFile);
    const chunks: (string | Buffer)[] = [];

    // HANDLE ANY ERRORS WHILE READING
    readStream.on('error', err => {
      reject(`Error reading file: ', ${err}`);
    });

    // LISTEN FOR DATA
    readStream.on('data', chunk => {
      chunks.push(chunk);
    });

    // FILE IS DONE BEING READ
    readStream.on('close', () => {
      // CREATE A BUFFER OF THE IMAGE FROM THE STREAM
      resolve(chunks);
    });
  });
}
