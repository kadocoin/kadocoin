import { peersStorageFile } from '../config/constants';
import appendPeerToFile from '../util/appendPeerToFile';

class Peers {
  addToFile(peer: { host: string; port: number }): void {
    appendPeerToFile([peer], peersStorageFile);
  }
}

export default Peers;
