const bwipjs = require('bwip-js');
const fs = require('fs');

const barcodeData = `@
\x1eANSI 6360140800
DL
DAQJ2035206
DCSJOHNSON
DACSAMI
DADNONE
DBB10101997
DBA10012030
DBD09302025
DBC1
DAYBRN
DAZBLK
DAU070
DAW132
DAG1 FIRST AMERICAN WAY
DAISANTA ANA
DAJCA
DAK92707000000
DCAC
DCBNONE
DCDNONE
DCF093020259298IFMZ
DCGUSA`;

bwipjs.toBuffer({
  bcid: 'pdf417',
  text: barcodeData,
  scale_x: 2,
  scale_y: 2,
  height: 10,
  includetext: false,
  textxalign: 'center'
}, (err, img) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  fs.writeFileSync('/home/kali/workspace/driver-license-generator/generated_barcode.png', img);
  console.log('Barcode generated and saved to /home/kali/workspace/driver-license-generator/generated_barcode.png');
});
