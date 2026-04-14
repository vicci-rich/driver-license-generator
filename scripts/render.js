const { createCanvas, loadImage } = require('canvas');
const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..');
const requestsDir = path.join(__dirname, '..', 'requests');
const responsesDir = path.join(__dirname, '..', 'responses');

async function renderDL(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const id = path.basename(jsonFile, '.json');

  // --- 1. RENDER BACK ---
  console.log(`[${id}] Rendering back...`);
  const backCanvas = createCanvas(600, 380);
  const backCtx = backCanvas.getContext('2d');
  const backTemplate = await loadImage(path.join(templatesDir, 'down.jpg'));
  backCtx.drawImage(backTemplate, 0, 0, 600, 380);

  // Generate AAMVA string for barcode
  const aamvaData = `@\n\x1e\rANSI 6360140800\nDL\nDAQ${data.licenseNumber}\nDCS${data.lastName}\nDAC${data.firstName}\nDAD${data.middleName || 'NONE'}\nDBA${data.expiryDate.replace(/-/g, '')}\nDBB${data.dateOfBirth.replace(/-/g, '')}\nDBD${data.issueDate.replace(/-/g, '')}\nDBC${data.sex || '1'}\nDAY${data.eyeColor || 'BRN'}\nDAZ${data.hairColor || 'BLK'}\nDAU${data.height || '070'}\nDAW${data.weight || '150'}\nDAG${data.address.street}\nDAI${data.address.city}\nDAJ${data.address.state}\nDAK${data.address.zip.replace(/-/g, '')}000000\nDCAC\nDCBNONE\nDCDNONE\nDCF${data.issueDate.replace(/-/g, '')}9298IFMZ\nDCGUSA\r`;

  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: 'pdf417',
    text: aamvaData,
    scale_x: 2, scale_y: 1.5, height: 15
  });
  const barcodeImg = await loadImage(barcodeBuffer);
  backCtx.drawImage(barcodeImg, 600 * 0.1, 380 * 0.7, 600 * 0.8, 380 * 0.22);
  fs.writeFileSync(path.join(responsesDir, `${id}_back.jpg`), backCanvas.toBuffer('image/jpeg'));

  // --- 2. RENDER FRONT ---
  console.log(`[${id}] Rendering front...`);
  const frontCanvas = createCanvas(600, 380);
  const frontCtx = frontCanvas.getContext('2d');
  const frontTemplate = await loadImage(path.join(templatesDir, 'up.jpg'));
  frontCtx.drawImage(frontTemplate, 0, 0, 600, 380);

  // Overlay Photo
  const photoPath = path.join(templatesDir, data.photo || 'Photo.jpg');
  if (fs.existsSync(photoPath)) {
    const photoImg = await loadImage(photoPath);
    frontCtx.drawImage(photoImg, 45, 65, 145, 185);
    frontCtx.globalAlpha = 0.5;
    frontCtx.drawImage(photoImg, 430, 210, 80, 100);
    frontCtx.globalAlpha = 1.0;
  }

  // Overlay Text
  frontCtx.fillStyle = 'black';
  frontCtx.font = 'bold 16px "Arial"';
  frontCtx.fillText(`DL ${data.licenseNumber}`, 250, 75);
  frontCtx.fillText(`EXP ${data.expiryDate}`, 250, 100);
  frontCtx.fillText(`LN ${data.lastName}`, 250, 125);
  frontCtx.fillText(`FN ${data.firstName}`, 250, 150);
  frontCtx.fillText(data.address.street, 250, 180);
  frontCtx.fillText(`${data.address.city}, ${data.address.state} ${data.address.zip}`, 250, 205);
  frontCtx.fillText(`DOB ${data.dateOfBirth}`, 250, 235);
  
  fs.writeFileSync(path.join(responsesDir, `${id}_front.jpg`), frontCanvas.toBuffer('image/jpeg'));
  console.log(`[${id}] Completed DL!`);
}

async function renderPassport(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const id = path.basename(jsonFile, '.json');

  console.log(`[${id}] Rendering Passport...`);
  const canvas = createCanvas(433, 564);
  const ctx = canvas.getContext('2d');
  const template = await loadImage(path.join(templatesDir, 'passport_template.jpg'));
  ctx.drawImage(template, 0, 0, 433, 564);

  // Overlay Photo
  const photoPath = path.join(templatesDir, data.photo || 'Photo.jpg');
  if (fs.existsSync(photoPath)) {
    const photoImg = await loadImage(photoPath);
    ctx.drawImage(photoImg, 35, 345, 125, 155);
  }

  // Overlay Data
  ctx.fillStyle = 'black';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText(data.lastName, 175, 395);
  ctx.fillText(data.firstName, 175, 415);
  ctx.fillText(data.nationality || 'UNITED STATES OF AMERICA', 175, 435);
  ctx.fillText(data.dateOfBirth.replace(/-/g, '/'), 175, 455);
  ctx.fillText(data.sex === '1' ? 'M' : 'F', 340, 475);
  ctx.fillText(data.passportNumber || '123456789', 350, 375);
  ctx.fillText(data.issueDate.replace(/-/g, '/'), 340, 495);
  ctx.fillText(data.expiryDate.replace(/-/g, '/'), 340, 515);

  // Simple MRZ Generation
  const surname = (data.lastName.toUpperCase() + '<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 39);
  const names = (data.firstName.toUpperCase() + '<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 44 - surname.length - 2);
  const line1 = `P<USA${surname}<<${names}`.padEnd(44, '<');
  
  const dob = data.dateOfBirth.slice(2).replace(/-/g, '');
  const exp = data.expiryDate.slice(2).replace(/-/g, '');
  const line2 = `${data.passportNumber || '123456789'}0USA${dob}6${data.sex === '1' ? 'M' : 'F'}${exp}5<<<<<<<<<<<<<<06`.padEnd(44, '<');

  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillText(line1, 35, 545);
  ctx.fillText(line2, 35, 560);

  fs.writeFileSync(path.join(responsesDir, `${id}_passport.jpg`), canvas.toBuffer('image/jpeg'));
  console.log(`[${id}] Completed Passport!`);
}

async function processRequest(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  if (data.type === 'passport') {
    await renderPassport(jsonFile);
  } else {
    await renderDL(jsonFile);
  }
}

const args = process.argv.slice(2);
if (args.length > 0) {
  processRequest(args[0]).catch(console.error);
} else {
  fs.readdirSync(requestsDir).filter(f => f.endsWith('.json')).forEach(f => {
    processRequest(path.join(requestsDir, f)).catch(console.error);
  });
}
