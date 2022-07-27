import * as net from 'net';

export function stripBaseDomain() {}

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
  return isPortReachable(host, 443);
}
