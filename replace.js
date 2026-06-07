const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/Helav Cafe/g, 'MAS MENU');
  content = content.replace(/هێلاڤ کافێ/g, 'MAS MENU'); // Some Kurdish references to the cafe maybe? Let's check!
  content = content.replace(/هێلاڤ/g, 'MAS MENU'); // Let's not blindly replace Kurdish if we are not sure, but user says "helav cafe change to MAS MENU".
  content = content.replace(/Helav/g, 'MAS MENU');
  fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory('./src');
console.log('Done');
