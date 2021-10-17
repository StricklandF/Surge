const https = require('https');
const { promises: fsPromises } = require('fs');
const { resolve: pathResolve } = require('path');

let cidrTools;

try {
  cidrTools = require('cidr-tools');
} catch (e) {
  console.log('Dependency "cidr-tools" not found');
  console.log('"npm i cidr-tools" then try again!');
  process.exit(1);
}

(async () => {
  const cidr = (await get('raw.githubusercontent.com', 'misakaio/chnroutes2/master/chnroutes.txt')).split('\n');

  const filteredCidr = cidr.filter(line => {
    if (line) {
      return !line.startsWith('#')
    }

    return false;
  })

  return fsPromises.writeFile(pathResolve(__dirname, '../List/ip/china_ip.conf'), makeCidrList(filteredCidr), { encoding: 'utf-8' });
})();

function makeCidrList(cidr) {
  const date = new Date();

  return `############################
# Mainland China IPv4 CIDR
# Data from vx.link (tmplink @ GitHub)
# Last Updated: ${date.getFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}
# Routes: ${cidr.length}
############################\n` + cidr.map(i => `IP-CIDR,${i}`).join('\n') + '\n########### END ############\n';
};

function get(hostname, path) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: 'GET',
      },
      (res) => {
        const body = [];
        res.on('data', (chunk) => {
          body.push(chunk);
        });
        res.on('end', () => {
          try {
            resolve(String(Buffer.concat(body)));
          } catch (e) {
            reject(e);
          }
        });
        req.on('error', (err) => {
          reject(err);
        });
      }
    );

    req.end();
  });
}