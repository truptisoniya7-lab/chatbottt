const fs = require('fs');
const html = fs.readFileSync('website/index.html', 'utf8');
const pcards = html.match(/class="pcard-name">([^<]+)/g);
if (pcards) console.log('PCARDS:', pcards.map(c => c.replace('class="pcard-name">', '').replace(/<br>/g, ' ')));

const tcards = html.match(/class="tcard-name">([^<]+)/g);
if (tcards) console.log('TCARDS:', tcards.map(c => c.replace('class="tcard-name">', '').replace(/<br>/g, ' ')));
