// === KONFIGURASI UTAMA ===
const API_URL = "GANTI_DENGAN_URL_WEB_APP_KAMU";
const VIEWER_URL = "https://sururialfaruq.github.io/Inventaris_Pondok_Pesantren_Ar-Rohman_Tegalrejo/dokumentasi.html";
// Catatan: pastikan nama repo/path di VIEWER_URL sesuai dengan repository GitHub Pages proyek ini

let fotoDokumentasiBase64 = "";

/**
 * Kompres file gambar ke resolusi maks 700px & kualitas JPEG 0.6
 * Menjaga panjang string tetap aman dari batas sel Google Sheets (50.000 karakter)
 */
function kompresFotoKeBase64(file, maxWidth = 700, quality = 0.6) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("File harus berupa gambar."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let result = canvas.toDataURL("image/jpeg", currentQuality);

        // Jika masih mendekati batas 50.000 karakter per sel Sheets, turunkan kualitas bertahap
        while (result.length > 46000 && currentQuality > 0.25) {
          currentQuality -= 0.1;
          result = canvas.toDataURL("image/jpeg", currentQuality);
        }

        resolve(result);
      };
      img.onerror = () => reject(new Error("Gagal membaca gambar."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Gagal memuat file dari perangkat."));
    reader.readAsDataURL(file);
  });
}

// Contoh pemakaian saat input file foto berubah (sesuaikan id input di index.html jika berbeda)
const inputFotoEl = document.getElementById("inputFotoDokumentasi");
if (inputFotoEl) {
  inputFotoEl.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      fotoDokumentasiBase64 = "";
      return;
    }
    try {
      fotoDokumentasiBase64 = await kompresFotoKeBase64(file);
    } catch (err) {
      alert(err.message);
      fotoDokumentasiBase64 = "";
      event.target.value = "";
    }
  });
}

/**
 * Membuat link dokumentasi berdasarkan ID_Log
 */
function buatLinkDokumentasi(idLog, hasFoto) {
  if (!idLog || !hasFoto) return "";
  return `${VIEWER_URL}?id=${encodeURIComponent(idLog)}`;
}

/**
 * Contoh format teks rekap WA per log absensi
 * logItem: { idLog, ruang, idJadwal, pengawas, hadir, tidakHadir, total, kondisi, hasFoto, detailTidakHadir }
 */
function formatPesanRekapWA(logItem) {
  const linkFoto = buatLinkDokumentasi(logItem.idLog, Boolean(logItem.hasFoto));

  let teks = `*REKAP ABSENSI UJIAN PUTRA*\n`;
  teks += `Madin Ar Rohman Tegalrejo\n\n`;
  teks += `• Jadwal : ${logItem.idJadwal || "-"}\n`;
  teks += `• Ruang : ${logItem.ruang || "-"}\n`;
  teks += `• Pengawas : ${logItem.pengawas || "-"}\n`;
  teks += `• Kehadiran : ${logItem.hadir}/${logItem.total} (Absen: ${logItem.tidakHadir})\n`;
  teks += `• Kondisi : ${logItem.kondisi || "-"}\n`;

  if (Array.isArray(logItem.detailTidakHadir) && logItem.detailTidakHadir.length > 0) {
    teks += `\n*Santri Tidak Hadir:*\n`;
    logItem.detailTidakHadir.forEach((s, idx) => {
      teks += `${idx + 1}. ${s.nama} (${s.kelas}) — ${s.alasan}${s.catatan ? ` [${s.catatan}]` : ""}\n`;
    });
  }

  if (linkFoto) {
    teks += `\n*Foto Dokumentasi:*\n${linkFoto}\n`;
  }

  return teks.trim();
}

function bukaWhatsAppDenganPesan(pesan) {
  const url = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}