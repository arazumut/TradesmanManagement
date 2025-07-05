/**
 * Bu script, tüm route dosyalarını tarayarak swagger açıklamalarındaki
 * URL'lerdeki /api/ önekini kaldırır. Bu, tüm API endpointlerinin
 * /api altında gruplandırılmasını sağlar.
 */

const fs = require('fs');
const path = require('path');
const routesDir = path.join(__dirname, 'src', 'routes');

// Route dosyalarını oku
fs.readdir(routesDir, (err, files) => {
  if (err) {
    console.error('Dosyaları okurken hata oluştu:', err);
    return;
  }

  // Sadece .js uzantılı dosyaları filtrele
  const jsFiles = files.filter(file => file.endsWith('.js'));

  // Her dosyayı işle
  jsFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    
    // Dosya içeriğini oku
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`${file} dosyasını okurken hata oluştu:`, err);
        return;
      }

      // Swagger açıklamalarındaki URL'leri güncelle
      // Örnek: /api/auth/login -> /auth/login
      const updatedData = data.replace(/\/api\/([a-zA-Z0-9-_/]+):/g, '/$1:');

      // Değişiklikleri kaydet
      fs.writeFile(filePath, updatedData, 'utf8', err => {
        if (err) {
          console.error(`${file} dosyasını yazarken hata oluştu:`, err);
          return;
        }
        console.log(`${file} dosyası güncellendi.`);
      });
    });
  });
});
