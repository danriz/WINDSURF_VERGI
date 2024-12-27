const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

// CORS ayarları
app.use(cors());

// TCMB kur endpoint'i
app.get('/api/kur/:date', async (req, res) => {
    try {
        const date = req.params.date; // YYYYMMDD formatında
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        
        const url = `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`;
        
        const response = await axios.get(url);
        res.set('Content-Type', 'application/xml');
        res.send(response.data);
    } catch (error) {
        console.error('TCMB kur çekme hatası:', error.message);
        res.status(404).json({ 
            error: 'Kur bilgisi bulunamadı',
            message: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Proxy sunucusu http://localhost:${port} adresinde çalışıyor`);
});
