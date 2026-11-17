# 🎤 Sesli Not Defteri

Mikrofonla konuş → Not Defteri'ne yazılsın.

## Özellikler (isteklerine göre)
- **Masaüstü uygulaması (Electron)**
- **Dil:** 🇹🇷 Türkçe + 🇬🇧 English seçimi
- **Mod:** Bas-konuş-durdur (butona bas, konuş, durdur)
- **Gelişmiş not defteri:** yeni / aç / kaydet / sil / yeniden adlandır (çift tık) / ara / oto-kaydet / kopyala / kelime-karakter sayacı
- **Dışa aktarma:** TXT + DOCX + PDF
- **Tema:** açık + koyu + buton
- **Sesli noktalama:** `nokta, virgül, soru işareti, ünlem, yeni satır, yeni paragraf, son kelimeyi sil` (EN karşılığı da var)
- Notlar tarayıcının `localhost:8080` hafızasında saklanır (yazarken otomatik kaydedilir).
- **Otomatik mod:** 🔁 butonuna bas, konuş; sustukça yazı eklenir. Tekrar basınca durur.
- Ses tanıma internet gerektirir (Web Speech API).

Logo: `logo.svg` (kaynak) → `logo-512/192/48/32/16.png`, `logo.ico` (simge dosya adı değişirse Windows/Chrome önbelleği yenilenir).

## Kurulum (ilk kez kullanacaklar için)
1. [Node.js](https://nodejs.org) (LTS) ve Google Chrome kurulu olsun.
2. Bu repoyu indir: yeşil **Code** > **Download ZIP**, ZIP'i bir klasöre çıkar.
3. Klasördeki **`Sesli Not Defteri.vbs`** dosyasına çift tıkla.
4. İlk açılışta mikrofon izni sorulursa **İzin Ver** de.
5. İstersen `.vbs` dosyasına sağ tık > Kısayol oluştur, kısayolu masaüstüne taşı.

> Konuşmayı yazıya çevirme Chrome'un Google servisiyle çalışır, internet gerekir.

## Uygulama olarak açma (önerilen)
Masaüstündeki **Sesli Not Defteri** kısayoluna (veya klasördeki `Sesli Not Defteri.lnk` / `.vbs`) çift tıkla.
- CMD penceresi açılmaz: `node server.js` gizli çalışır.
- Chrome `--app` modunda adres çubuğu olmayan ayrı bir pencere açılır (Web Speech API Chrome'da çalışır, Electron'da çalışmaz).
- Notlar Chrome'un `localhost:8080` hafızasında kalır (eski "Chrome ile Aç" notlarıyla aynı yer).
- Pencere kapanınca sunucu ~10 sn içinde kendini kapatır (her pencere kimlikli /ping atar; hiç pencere kalmayınca kapanır, sinyal gelmezse en geç 3 dk).
- Yazarken otomatik kaydeder; Ctrl+S de çalışır. Başlığı değiştirmek notun adını değiştirir.
- TXT/DOCX/PDF nereye kaydedileceğini sorar. PDF, Windows'un Arial fontuyla Türkçe karakterli ve çok sayfalı çıkar.

## Electron sürümü (eski)
```bat
npm install
npm start
```

Mikrofon izni isterse "İzin Ver" de.

## EXE yapma (opsiyonel)
```bat
npm install --save-dev electron-builder
npm run pack
```
