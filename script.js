const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQh2Awp40_b4i_mNgSXs4Pmpd5LiFvdK41cIkR2y8bhnv_YacEZc6O_UGyKfgvo51Qa_7Xkhf7lbuVL/pub?output=csv";
const templateImage = "template-sertifikat-1.png";

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
  const queryInput = document.getElementById("nomorInput").value.trim();
  const hasil = document.getElementById("hasil");
  const cekBtn = document.getElementById("cekBtn");

  if (!queryInput) {
    hasil.innerHTML = `<p style="color:red;">Masukkan nama terlebih dahulu.</p>`;
    return;
  }

  cekBtn.disabled = true;
  cekBtn.innerHTML = `<span class="spinner"></span> Memeriksa...`;
  hasil.innerHTML = "";

  try {
    const data = await getData();
    const q = queryInput.toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    // cari semua peserta yang memenuhi semua token (partial, case-insensitive)
    const matches = data.filter(item => {
      const name = (item.nama || "").toLowerCase();
      return tokens.every(t => name.includes(t));
    });

    if (matches.length === 1) {
      // tampilkan nama aman tanpa injeksi HTML
      hasil.innerHTML = "";
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = "Nama: ";
      p.appendChild(strong);
      p.appendChild(document.createTextNode(matches[0].nama || ""));
      hasil.appendChild(p);

      generateSertifikat(matches[0].nama);
    } else if (matches.length > 1) {
      // tampilkan daftar pilihan jika lebih dari satu hasil
      hasil.innerHTML = `<p>Ditemukan ${matches.length} hasil. Pilih nama:</p>`;
      const ul = document.createElement("ul");
      ul.style.paddingLeft = "1.2rem";
      matches.forEach(match => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = match.nama || "(nama kosong)";
        btn.style.margin = "4px";
        btn.addEventListener("click", () => {
          // tampilkan pilihan dan generate sertifikat
          hasil.innerHTML = "";
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = "Nama: ";
          p.appendChild(strong);
          p.appendChild(document.createTextNode(match.nama || ""));
          hasil.appendChild(p);
          generateSertifikat(match.nama);
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });
      hasil.appendChild(ul);
    } else {
      hasil.innerHTML = `<p style="color:red;">Nama tidak ditemukan.</p>`;
    }
  } catch (err) {
    console.error(err);
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
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    let fontSize = 100;
    const maxWidth = 1100;
    const x = canvas.width / 3.5;
    const y = canvas.height / 1.8;

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
