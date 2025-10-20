const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQh2Awp40_b4i_mNgSXs4Pmpd5LiFvdK41cIkR2y8bhnv_YacEZc6O_UGyKfgvo51Qa_7Xkhf7lbuVL/pub?output=csv";
const templateImage = "template-sertifikat.png";

async function getData() {
  const response = await fetch(sheetURL);
  const csv = await response.text();
  const rows = csv.split("\n").map(r => r.trim().split(","));
  const headers = rows.shift().map(h => h.toLowerCase());
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

async function cekPeserta() {
  const nomorInput = document.getElementById("nomorInput").value.trim();
  const hasil = document.getElementById("hasil");
  const cekBtn = document.getElementById("cekBtn");

  if (!nomorInput) {
    hasil.innerHTML = `<p style="color:red;">Masukkan nomor NTA terlebih dahulu.</p>`;
    return;
  }

  cekBtn.disabled = true;
  cekBtn.innerHTML = `<span class="spinner"></span> Memeriksa...`;
  hasil.innerHTML = "";

  try {
    const data = await getData();
    const peserta = data.find(item => item.nomor === nomorInput);

    if (peserta) {
      hasil.innerHTML = `<p><strong>Nama:</strong> ${peserta.nama}</p>`;
      generateSertifikat(peserta.nama);
    } else {
      hasil.innerHTML = `<p style="color:red;">Nomor tidak ditemukan.</p>`;
    }
  } catch (err) {
    hasil.innerHTML = `<p style="color:red;">Gagal memuat data.</p>`;
  } finally {
    cekBtn.disabled = false;
    cekBtn.textContent = "Cek";
  }
}

function generateSertifikat(nama) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = templateImage;

  img.onload = function() {
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = "600px";
    canvas.style.height = "auto";

    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = "#51288D";
    ctx.textAlign = "center";
    let fontSize = 80;
    const maxWidth = 1100;
    const x = canvas.width / 2;
    const y = canvas.height / 2 - 1;

    do {
      ctx.font = `bold ${fontSize}px 'Poppins', 'Arial', sans-serif`;
      const textWidth = ctx.measureText(nama).width;
      if (textWidth <= maxWidth) break;
      fontSize -= 2;
    } while (fontSize > 20);

    ctx.fillText(nama, x, y);

    canvas.style.display = "block";
    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.style.display = "inline-block";
    downloadBtn.download = `Sertifikat ${nama}.png`;
    downloadBtn.href = canvas.toDataURL("image/png");
  };
}

document.getElementById("nomorInput").addEventListener("keypress", e => {
  if (e.key === "Enter") cekPeserta();
});
