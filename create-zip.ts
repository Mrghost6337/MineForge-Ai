import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

async function createZip() {
  const zip = new AdmZip();
  const sourceDir = path.join(process.cwd(), 'desktop-client');
  const readmePath = path.join(process.cwd(), 'README.md');
  const outputPath = path.join(process.cwd(), 'MineForge-Host-Client-Source.zip');

  console.log('Zipping desktop-client folder...');
  
  // Add desktop-client folder, but exclude node_modules and dist
  zip.addLocalFolder(sourceDir, 'desktop-client', (filename) => {
    return !filename.includes('node_modules') && !filename.includes('dist') && !filename.includes('release');
  });

  // Add root README.md
  if (fs.existsSync(readmePath)) {
    zip.addLocalFile(readmePath);
  }

  // Write the zip file
  zip.writeZip(outputPath);
  console.log(`Successfully created ZIP: ${outputPath}`);
}

createZip().catch(console.error);
