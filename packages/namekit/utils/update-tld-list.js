const fs = require('fs');
const path = require('path');
const tr46 = require('tr46');
const https = require('https');

const TLD_LIST_URL = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt';

function fetchDomains() {
  return new Promise((resolve, reject) => {
    const request = https.request(TLD_LIST_URL, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data = data + chunk.toString();
      });
      response.on('end', () => {
        resolve(data);
      });
    });
    request.on('error', (error) => {
      reject(error);
    });
    request.end();
  });
}

fetchDomains()
  .then((data) => {
    const rawDomains = data.split(/\n+/gi);
    console.log('Fetched TLD list:', rawDomains[0].slice(2));
    const domains = rawDomains.reduce((tlds, item) => {
      let { domain: tld, error } = tr46.toUnicode(item.trim().toLowerCase(), {
        useSTD3ASCIIRules: true
      });
      if (error || !tld || tld.startsWith('#')) {
        return tlds;
      }
      tlds.push(tld);
      return tlds;
    }, []);
    domains.sort();
    fs.writeFileSync(
      path.join(__dirname, '../src/lib/icann_tlds.json'),
      JSON.stringify(domains, null, 2)
    );
    console.log('ICANN TLD list updated successfully!');
  })
  .catch((e) => {
    console.error(e);
  });
