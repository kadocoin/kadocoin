import appendPeerToFile from '../util/appendPeerToFile';

class Peers {
  addToFile(peer: { host: string; port: number }): void {
    appendPeerToFile([peer]);
  }
}

export default Peers;
