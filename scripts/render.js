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

  console.log(`[${id}] Rendering high-fidelity DL (Shadow-X1 v2)...`);
  
  // Use 1280x800 resolution for high-fidelity
  const width = 1280;
  const height = 800;
  
  // --- 1. RENDER BACK ---
  const backCanvas = createCanvas(width, height);
  const backCtx = backCanvas.getContext('2d');
  const backTemplate = await loadImage(path.join(templatesDir, 'templates', 'down.jpg'));
  backCtx.drawImage(backTemplate, 0, 0, width, height);

  // AAMVA data for barcode
  const aamvaData = `@\n\x1e\rANSI 6360140800\nDL\nDAQ${data.licenseNumber}\nDCS${data.lastName}\nDAC${data.firstName}\nDAD${data.middleName || 'NONE'}\nDBA${data.expiryDate.replace(/-/g, '')}\nDBB${data.dateOfBirth.replace(/-/g, '')}\nDBD${data.issueDate.replace(/-/g, '')}\nDBC${data.sex || '1'}\nDAY${data.eyeColor || 'BRN'}\nDAZ${data.hairColor || 'BLK'}\nDAU${data.height || '070'}\nDAW${data.weight || '150'}\nDAG${data.address.street}\nDAI${data.address.city}\nDAJ${data.address.state}\nDAK${data.address.zip.replace(/-/g, '')}000000\nDCAC\nDCBNONE\nDCDNONE\nDCF${data.issueDate.replace(/-/g, '')}9298IFMZ\nDCGUSA\r`;

  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: 'pdf417',
    text: aamvaData,
    scale_x: 4, scale_y: 3, height: 20
  });
  const barcodeImg = await loadImage(barcodeBuffer);
  // Barcode placement on back (scaled for 1280x800)
  backCtx.drawImage(barcodeImg, width * 0.1, height * 0.7, width * 0.8, height * 0.22);
  fs.writeFileSync(path.join(responsesDir, `${id}_back.jpg`), backCanvas.toBuffer('image/jpeg'));

  // --- 2. RENDER FRONT ---
  const frontCanvas = createCanvas(width, height);
  const frontCtx = frontCanvas.getContext('2d');
  const frontTemplate = await loadImage(path.join(templatesDir, 'templates', 'up.jpg'));
  frontCtx.drawImage(frontTemplate, 0, 0, width, height);

  // Overlay Photo
  const photoPath = path.join(templatesDir, 'templates', data.photo || 'Photo.jpg');
  if (fs.existsSync(photoPath)) {
    const photoImg = await loadImage(photoPath);
    // Position matched to up.jpg / sorry.jpg layout (left side)
    // Coords for 1280x800 scaling
    frontCtx.drawImage(photoImg, 100, 140, 390, 500);
    // Ghost photo (right side, lower opacity, black & white-ish look)
    frontCtx.globalAlpha = 0.45;
    frontCtx.filter = 'grayscale(100%) brightness(1.2)';
    frontCtx.drawImage(photoImg, 830, 440, 185, 235);
    frontCtx.globalAlpha = 1.0;
    frontCtx.filter = 'none';
  }

  // Overlay Text - Red/Brown-ish for fields
  const fieldColor = '#4a2c2a'; 
  const valColor = '#000000';
  
  frontCtx.font = 'bold 36px "Arial"';
  
  // Placement refined for 1280x800
  const xOffset = 520;
  let y = 160;
  const lineSpacing = 55;

  frontCtx.fillStyle = fieldColor; frontCtx.fillText('DL', xOffset - 60, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.licenseNumber, xOffset, y);
  y += lineSpacing;

  frontCtx.fillStyle = fieldColor; frontCtx.fillText('EXP', xOffset - 60, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.expiryDate.replace(/-/g, '/'), xOffset, y);
  y += lineSpacing;

  frontCtx.fillStyle = fieldColor; frontCtx.fillText('LN', xOffset - 60, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.lastName, xOffset, y);
  y += lineSpacing;

  frontCtx.fillStyle = fieldColor; frontCtx.fillText('FN', xOffset - 60, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.firstName, xOffset, y);
  y += lineSpacing;

  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.address.street, xOffset - 60, y);
  y += lineSpacing;
  frontCtx.fillStyle = valColor;   frontCtx.fillText(`${data.address.city}, ${data.address.state} ${data.address.zip}`, xOffset - 60, y);
  y += lineSpacing;

  frontCtx.fillStyle = fieldColor; frontCtx.fillText('DOB', xOffset - 60, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.dateOfBirth.replace(/-/g, '/'), xOffset, y);
  y += lineSpacing;

  frontCtx.fillStyle = fieldColor; frontCtx.fillText('RSTR', xOffset - 60, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText('NONE', xOffset + 50, y);
  
  // Bottom row fields
  y = 650;
  frontCtx.font = 'bold 30px "Arial"';
  frontCtx.fillStyle = fieldColor; frontCtx.fillText('SEX', xOffset + 100, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.sex === '1' ? 'M' : 'F', xOffset + 170, y);
  
  frontCtx.fillStyle = fieldColor; frontCtx.fillText('HAIR', xOffset + 300, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.hairColor || 'BLK', xOffset + 390, y);
  
  frontCtx.fillStyle = fieldColor; frontCtx.fillText('EYES', xOffset + 520, y);
  frontCtx.fillStyle = valColor;   frontCtx.fillText(data.eyeColor || 'BRN', xOffset + 610, y);

  fs.writeFileSync(path.join(responsesDir, `${id}_front.jpg`), frontCanvas.toBuffer('image/jpeg'));
  console.log(`[${id}] High-fidelity DL completed!`);
}

async function renderPassport(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const id = path.basename(jsonFile, '.json');

  console.log(`[${id}] Rendering Passport...`);
  const canvas = createCanvas(1280, 1600); // Higher res passport
  const ctx = canvas.getContext('2d');
  const template = await loadImage(path.join(templatesDir, 'templates', 'passport_template.jpg'));
  ctx.drawImage(template, 0, 0, 1280, 1600);

  // Photo
  const photoPath = path.join(templatesDir, 'templates', data.photo || 'Photo.jpg');
  if (fs.existsSync(photoPath)) {
    const photoImg = await loadImage(photoPath);
    ctx.drawImage(photoImg, 100, 1000, 360, 450);
  }

  // Data
  ctx.fillStyle = 'black';
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.fillText(data.lastName, 500, 1120);
  ctx.fillText(data.firstName, 500, 1180);
  ctx.fillText(data.nationality || 'UNITED STATES OF AMERICA', 500, 1240);
  ctx.fillText(data.dateOfBirth.replace(/-/g, '/'), 500, 1300);
  ctx.fillText(data.sex === '1' ? 'M' : 'F', 1000, 1360);
  ctx.fillText(data.passportNumber || '123456789', 1050, 1050);

  // MRZ (TD3)
  const surname = (data.lastName.toUpperCase() + '<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 39);
  const names = (data.firstName.toUpperCase() + '<<<<<<<<<<<<<<<<<<<<<<<<').slice(0, 44 - surname.length - 2);
  const line1 = `P<USA${surname}<<${names}`.padEnd(44, '<');
  
  const dob = data.dateOfBirth.slice(2).replace(/-/g, '');
  const exp = data.expiryDate.slice(2).replace(/-/g, '');
  const line2 = `${data.passportNumber || '123456789'}0USA${dob}6${data.sex === '1' ? 'M' : 'F'}${exp}5<<<<<<<<<<<<<<06`.padEnd(44, '<');

  ctx.font = 'bold 42px "Courier New", monospace';
  ctx.fillText(line1, 100, 1530);
  ctx.fillText(line2, 100, 1580);

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
  if (fs.existsSync(requestsDir)) {
    fs.readdirSync(requestsDir).filter(f => f.endsWith('.json')).forEach(f => {
      processRequest(path.join(requestsDir, f)).catch(console.error);
    });
  }
}
