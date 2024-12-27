document.addEventListener('DOMContentLoaded', function() {
    // Vergi dilimleri tablosu
    const vergiDilimleriTable = document.getElementById('vergiDilimleriTable');
    const saveVergiDilimleriBtn = document.getElementById('saveVergiDilimleri');
    let vergiDilimleri = [];

    // Vergi dilimlerini localStorage'dan yükle
    loadVergiDilimleri();

    // Kaydet butonuna tıklandığında
    saveVergiDilimleriBtn.addEventListener('click', function() {
        saveVergiDilimleri();
        alert('Vergi dilimleri kaydedildi!');
    });

    function loadVergiDilimleri() {
        const savedDilimler = localStorage.getItem('vergiDilimleri');
        if (savedDilimler) {
            const dilimler = JSON.parse(savedDilimler);
            const rows = vergiDilimleriTable.querySelectorAll('tbody tr');
            
            rows.forEach((row, index) => {
                if (dilimler[index]) {
                    const inputs = row.querySelectorAll('input');
                    inputs[0].value = dilimler[index].altSinir;
                    inputs[1].value = dilimler[index].ustSinir;
                    inputs[2].value = dilimler[index].oran;
                }
            });
        }
        updateVergiDilimleri();
    }

    function saveVergiDilimleri() {
        updateVergiDilimleri();
        localStorage.setItem('vergiDilimleri', JSON.stringify(vergiDilimleri));
    }

    function updateVergiDilimleri() {
        vergiDilimleri = [];
        const rows = vergiDilimleriTable.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            vergiDilimleri.push({
                altSinir: Number(inputs[0].value),
                ustSinir: Number(inputs[1].value),
                oran: Number(inputs[2].value)
            });
        });
    }

    // Yurt içi temettü elementleri
    const yurticiCheckbox = document.getElementById('yurticiTemettuCheck');
    const yurticiForm = document.getElementById('yurticiTemettuForm');
    const netTemettuInput = document.getElementById('netTemettu');
    const stopajOraniInput = document.getElementById('stopajOrani');

    // Yurt dışı temettü elementleri
    const yurtdisiCheckbox = document.getElementById('yurtdisiTemettuCheck');
    const yurtdisiForm = document.getElementById('yurtdisiTemettuForm');

    // Yurt içi temettü form kontrolü
    yurticiCheckbox.addEventListener('change', function() {
        yurticiForm.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) {
            clearYurticiResults();
        }
    });

    // Yurt dışı temettü form kontrolü
    yurtdisiCheckbox.addEventListener('change', function() {
        yurtdisiForm.style.display = this.checked ? 'block' : 'none';
    });

    // Yurt içi temettü hesaplama
    netTemettuInput.addEventListener('input', calculateYurticiResults);
    stopajOraniInput.addEventListener('input', calculateYurticiResults);

    function calculateYurticiResults() {
        const netTemettu = parseFloat(netTemettuInput.value) || 0;
        const stopajOrani = parseFloat(stopajOraniInput.value) || 0;

        if (netTemettu === 0 || stopajOrani === 0) {
            clearYurticiResults();
            return;
        }

        const brutTemettu = netTemettu / (1 - (stopajOrani / 100));
        const stopajMiktari = brutTemettu - netTemettu;
        const vergiyeTabiKisim = brutTemettu / 2;

        // Vergi dilimi hesaplamaları
        const vergiHesaplama = hesaplaVergi(vergiyeTabiKisim);
        const karsilikOran = vergiHesaplama.karsilikOran;
        const alttanGelenVergi = vergiHesaplama.alttanGelenVergi;
        const oransalVergi = vergiHesaplama.oransalVergi;
        const mahsuplasmadanOnceVergi = alttanGelenVergi + oransalVergi;
        
        // Ödenecek vergi hesaplama
        let odenecekVergi = 0;
        if (mahsuplasmadanOnceVergi > 0) {
            odenecekVergi = mahsuplasmadanOnceVergi - stopajMiktari;
        } else if (mahsuplasmadanOnceVergi === 0) {
            odenecekVergi = 0;
        }

        // Sonuçları göster
        document.getElementById('brutTemettu').textContent = formatNumber(brutTemettu);
        document.getElementById('stopajMiktari').textContent = formatNumber(stopajMiktari);
        document.getElementById('vergiyeTabiKisim').textContent = formatNumber(vergiyeTabiKisim);
        document.getElementById('karsilikOran').textContent = formatNumber(karsilikOran);
        document.getElementById('alttanGelenVergi').textContent = formatNumber(alttanGelenVergi);
        document.getElementById('oransalVergi').textContent = formatNumber(oransalVergi);
        document.getElementById('mahsuplasmadanOnceVergi').textContent = formatNumber(mahsuplasmadanOnceVergi);
        document.getElementById('odenecekVergi').textContent = formatNumber(odenecekVergi);
    }

    function hesaplaVergi(gelir) {
        let alttanGelenVergi = 0;
        let oransalVergi = 0;
        let karsilikOran = 0;

        // Gelirin hangi dilime girdiğini bul
        let dilimIndex = -1;
        for (let i = 0; i < vergiDilimleri.length; i++) {
            if (gelir >= vergiDilimleri[i].altSinir && gelir < vergiDilimleri[i].ustSinir) {
                dilimIndex = i;
                karsilikOran = vergiDilimleri[i].oran;
                break;
            }
        }

        // En yüksek dilimden büyükse son dilimi kullan
        if (gelir >= vergiDilimleri[vergiDilimleri.length - 1].altSinir) {
            dilimIndex = vergiDilimleri.length - 1;
            karsilikOran = vergiDilimleri[dilimIndex].oran;
        }

        if (dilimIndex > 0) {
            // Bir önceki dilimin üst sınırı ve oranı ile çarp
            const oncekiDilim = vergiDilimleri[dilimIndex - 1];
            alttanGelenVergi = oncekiDilim.ustSinir * (oncekiDilim.oran / 100);
        }

        // Oransal vergiyi hesapla
        if (dilimIndex !== -1) {
            const dilimIciGelir = gelir - vergiDilimleri[dilimIndex].altSinir;
            oransalVergi = dilimIciGelir * (vergiDilimleri[dilimIndex].oran / 100);
        }

        return {
            alttanGelenVergi,
            oransalVergi,
            karsilikOran
        };
    }

    function clearYurticiResults() {
        document.getElementById('brutTemettu').textContent = '0.00';
        document.getElementById('stopajMiktari').textContent = '0.00';
        document.getElementById('vergiyeTabiKisim').textContent = '0.00';
        document.getElementById('karsilikOran').textContent = '0.00';
        document.getElementById('alttanGelenVergi').textContent = '0.00';
        document.getElementById('oransalVergi').textContent = '0.00';
        document.getElementById('mahsuplasmadanOnceVergi').textContent = '0.00';
        document.getElementById('odenecekVergi').textContent = '0.00';
    }

    // Global değişkenler
    window.satirSayisi = 1; // Başlangıçta 1 satır var

    // TCMB'den kur bilgisi al
    window.getTCMBKuru = async function(date, currency) {
        try {
            // Tarihi YYYYMMDD formatına çevir
            const dateObj = new Date(date);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const formattedDate = `${year}${month}${day}`;
            
            const response = await fetch(`http://localhost:3000/api/kur/${formattedDate}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            // Döviz koduna göre kur bilgisini bul
            const currencyNode = xmlDoc.querySelector(`Currency[Kod="${currency}"]`);
            
            if (currencyNode) {
                // ForexBuying alanındaki kur değerini al
                const forexBuying = currencyNode.querySelector('ForexBuying').textContent;
                return parseFloat(forexBuying);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Kur bilgisini güncelle
    window.updateTCMBKuru = async function(rowNum) {
        const date = document.getElementById('temettuTarihi_' + rowNum).value;
        const currency = document.getElementById('dovizCinsi_' + rowNum).value;
        const tcmbKuruInput = document.getElementById('tcmbKuru_' + rowNum);
        
        if (date && currency) {
            try {
                const kur = await window.getTCMBKuru(date, currency);
                
                if (kur) {
                    tcmbKuruInput.value = kur.toFixed(4);
                    window.hesaplamaYap(rowNum);
                } else {
                    throw new Error('Kur değeri alınamadı');
                }
            } catch (error) {
                tcmbKuruInput.value = '';
                document.getElementById('tlKarsiligi_' + rowNum).value = '';
                document.getElementById('yabanciVergi_' + rowNum).value = '';
                alert('Seçilen tarih için kur bilgisi bulunamadı veya bir hata oluştu!');
            }
        }
    }

    // Toplamları hesapla ve güncelle
    window.toplamlariHesapla = function() {
        let tlKarsiligiToplam = 0;
        let yabanciVergiToplam = 0;

        // Tüm satırları döngüyle kontrol et
        for (let i = 1; i <= window.satirSayisi; i++) {
            const tlKarsiligiElement = document.getElementById('tlKarsiligi_' + i);
            const yabanciVergiElement = document.getElementById('yabanciVergi_' + i);
            
            if (tlKarsiligiElement && tlKarsiligiElement.value) {
                tlKarsiligiToplam += parseFloat(tlKarsiligiElement.value) || 0;
            }
            
            if (yabanciVergiElement && yabanciVergiElement.value) {
                yabanciVergiToplam += parseFloat(yabanciVergiElement.value) || 0;
            }
        }

        // Toplamları güncelle
        document.getElementById('tlKarsiligiToplam').textContent = formatNumber(tlKarsiligiToplam);
        document.getElementById('yabanciVergiToplam').textContent = formatNumber(yabanciVergiToplam);
    }

    // Hesaplamaları yap
    window.hesaplamaYap = function(rowNum) {
        const brutMiktar = parseFloat(document.getElementById('brutMiktar_' + rowNum).value) || 0;
        const tcmbKuru = parseFloat(document.getElementById('tcmbKuru_' + rowNum).value) || 0;
        const vergiYuzdesi = parseFloat(document.getElementById('vergiYuzdesi_' + rowNum).value) || 0;
        const tlKarsiligiInput = document.getElementById('tlKarsiligi_' + rowNum);
        const yabanciVergiInput = document.getElementById('yabanciVergi_' + rowNum);

        if (brutMiktar && tcmbKuru) {
            // TL karşılığını hesapla
            const tlKarsiligi = brutMiktar * tcmbKuru;
            tlKarsiligiInput.value = tlKarsiligi.toFixed(2);

            // Yabancı ülke vergisini hesapla
            if (vergiYuzdesi) {
                const yabanciVergi = tlKarsiligi * (vergiYuzdesi / 100);
                yabanciVergiInput.value = yabanciVergi.toFixed(2);
            } else {
                yabanciVergiInput.value = '';
            }
            
            // Toplamları güncelle
            window.toplamlariHesapla();
        } else {
            tlKarsiligiInput.value = '';
            yabanciVergiInput.value = '';
        }
    }

    // Satır sil
    window.satirSil = function(rowNum) {
        const row = document.getElementById('row_' + rowNum);
        if (row) {
            row.remove();
            window.toplamlariHesapla();
        }
    }

    // Yeni satır ekle
    window.satirEkle = function() {
        window.satirSayisi++;
        
        const tbody = document.getElementById('temettuTableBody');
        
        if (!tbody) {
            return;
        }

        const yeniSatir = document.createElement('tr');
        yeniSatir.id = 'row_' + window.satirSayisi;
        
        yeniSatir.innerHTML = `
            <td><input type="date" class="form-control form-control-sm" id="temettuTarihi_${window.satirSayisi}"></td>
            <td><input type="number" class="form-control form-control-sm" step="0.01" id="brutMiktar_${window.satirSayisi}"></td>
            <td>
                <select class="form-select form-select-sm" id="dovizCinsi_${window.satirSayisi}">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                </select>
            </td>
            <td><input type="number" class="form-control form-control-sm" step="0.01" id="vergiYuzdesi_${window.satirSayisi}"></td>
            <td><input type="number" class="form-control form-control-sm" step="0.0001" id="tcmbKuru_${window.satirSayisi}" readonly></td>
            <td><input type="number" class="form-control form-control-sm" step="0.01" id="tlKarsiligi_${window.satirSayisi}" readonly></td>
            <td><input type="number" class="form-control form-control-sm" step="0.01" id="yabanciVergi_${window.satirSayisi}" readonly></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="window.satirSil(${window.satirSayisi})">Sil</button>
            </td>
        `;
        
        tbody.appendChild(yeniSatir);
        
        // Yeni satır için event listener'ları ekle
        const currentRow = window.satirSayisi;
        
        document.getElementById('temettuTarihi_' + currentRow).addEventListener('change', function() {
            window.updateTCMBKuru(currentRow);
        });
        
        document.getElementById('dovizCinsi_' + currentRow).addEventListener('change', function() {
            window.updateTCMBKuru(currentRow);
        });
        
        document.getElementById('brutMiktar_' + currentRow).addEventListener('input', function() {
            window.hesaplamaYap(currentRow);
        });
        
        document.getElementById('vergiYuzdesi_' + currentRow).addEventListener('input', function() {
            window.hesaplamaYap(currentRow);
        });

        // Sayfayı yeni satıra kaydır
        yeniSatir.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // Sayfa yüklendiğinde çalışacak kodlar
    window.addEventListener('load', function() {
        window.satirSayisi = 1;
        
        // İlk satır için event listener'ları ekle
        const firstRow = 1;
        const elements = {
            temettuTarihi: document.getElementById('temettuTarihi_' + firstRow),
            dovizCinsi: document.getElementById('dovizCinsi_' + firstRow),
            brutMiktar: document.getElementById('brutMiktar_' + firstRow),
            vergiYuzdesi: document.getElementById('vergiYuzdesi_' + firstRow),
            tcmbKuru: document.getElementById('tcmbKuru_' + firstRow),
            tlKarsiligi: document.getElementById('tlKarsiligi_' + firstRow),
            yabanciVergi: document.getElementById('yabanciVergi_' + firstRow)
        };

        if (elements.temettuTarihi && elements.dovizCinsi) {
            elements.temettuTarihi.addEventListener('change', function() {
                window.updateTCMBKuru(firstRow);
            });
            
            elements.dovizCinsi.addEventListener('change', function() {
                window.updateTCMBKuru(firstRow);
            });
            
            elements.brutMiktar.addEventListener('input', function() {
                window.hesaplamaYap(firstRow);
            });
            
            elements.vergiYuzdesi.addEventListener('input', function() {
                window.hesaplamaYap(firstRow);
            });
            
            // Mevcut değerleri kontrol et
            if (elements.temettuTarihi.value && elements.dovizCinsi.value) {
                window.updateTCMBKuru(firstRow);
            }
        }
    });

    function formatNumber(number) {
        return number.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
});
