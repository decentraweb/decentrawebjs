import * as net from 'net';
import Cache from './Cache';

const CACHE = new Cache<boolean>(10 * 60 * 1000);

export default async function isPortReachable(host: string, port: number, timeout = 1000) {
  const promise = new Promise((resolve, reject) => {
    const socket = new net.Socket();

    const onError = () => {
      socket.destroy();
      reject();
    };

    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', onError);

    socket.connect(port, host, () => {
      socket.end();
      resolve(null);
    });
  });

  try {
    await promise;
    return true;
  } catch {
    return false;
  }
}

export async function supportsHTTPS(host: string) {
  const cached = await CACHE.read(host);
  if (typeof cached !== 'undefined') {
    return cached;
  }
  const supportHTTPS = await isPortReachable(host, 443);
  await CACHE.write(host, supportHTTPS);
  return supportHTTPS;
}
