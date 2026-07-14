const fs = require('fs');
const https = require('https');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('Failed to download ' + url + ': ' + res.statusCode));
        return;
      }
      const fileStream = fs.createWriteStream(filepath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filepath);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
};

async function main() {
  const products = await prisma.product.findMany();
  for (const product of products) {
    if (product.image && product.image.startsWith('http')) {
      const filename = path.basename(product.image);
      const publicPath = '/assets/products/' + filename;
      const localPath = path.join(__dirname, '../kasa-saffron-react/public/assets/products', filename);
      
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      
      console.log('Downloading ' + product.image + '...');
      try {
        await downloadImage(product.image, localPath);
        await prisma.product.update({
          where: { id: product.id },
          data: { image: publicPath }
        });
        console.log('Updated product ' + product.id + ' image to ' + publicPath);
      } catch (err) {
        console.error('Failed for ' + product.id + ': ' + err.message);
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
