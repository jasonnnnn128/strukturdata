(() => {
  const $ = (id) => document.getElementById(id);

  const el = {
    asal: $("asal"),
    tujuan: $("tujuan"),
    tukar: $("tukar"),
    pesan: $("pesan"),
    kosong: $("kosong"),
    hasil: $("hasil"),
    jumlah: $("jumlah"),
    tarif: $("tarif"),
    rincian: $("rincian"),
    rute: $("rute"),
    aturan: $("aturan"),
    legendaDasar: $("legenda-dasar"),
    legendaTambahan: $("legenda-tambahan"),
    legendaTambahanWrap: $("legenda-tambahan-wrap"),
  };

  let aturan = null;
  let permintaanKe = 0;

  const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");

  function isiPilihan(select, daftar, placeholder) {
    select.replaceChildren();
    const kosong = new Option(placeholder, "");
    select.add(kosong);
    daftar.forEach((nama) => select.add(new Option(nama, nama)));
  }

  function tampilkanPesan(teks) {
    el.pesan.textContent = teks;
    el.pesan.hidden = false;
    el.hasil.hidden = true;
    el.kosong.hidden = true;
  }

  function tampilkanKosong() {
    el.pesan.hidden = true;
    el.hasil.hidden = true;
    el.kosong.hidden = false;
  }

  function buatItemRute(nama, i, total) {
    const li = document.createElement("li");
    li.style.setProperty("--i", i);
    if (i > aturan.batas) li.classList.add("tambah-titik");
    if (i >= aturan.batas) li.classList.add("tambah-garis");
    if (i === 0 || i === total - 1) li.classList.add("ujung");

    const teks = document.createElement("span");
    teks.className = "nama";
    teks.textContent = nama;
    li.append(teks);

    if (i === 0 || i === total - 1) {
      const ket = document.createElement("span");
      ket.className = "ket";
      ket.textContent = i === 0 ? "asal" : "tujuan";
      li.append(ket);
    }

    if (i > 0) {
      const urutan = document.createElement("span");
      urutan.className = "urutan";
      urutan.textContent = i;
      urutan.title = "Stasiun ke-" + i;
      li.append(urutan);
    }
    return li;
  }

  function tampilkanHasil(data) {
    el.pesan.hidden = true;
    el.kosong.hidden = true;

    el.jumlah.textContent = data.jumlah;
    el.tarif.textContent = rupiah(data.tarif);

    el.rincian.textContent = data.stasiun_tambahan
      ? `${rupiah(aturan.tarif_dasar)} untuk ${aturan.batas} stasiun pertama + ` +
        `${data.stasiun_tambahan} stasiun × ${rupiah(aturan.tarif_tambahan)} ` +
        `= ${rupiah(data.biaya_tambahan)}`
      : `Tarif dasar ${rupiah(aturan.tarif_dasar)} (sampai ${aturan.batas} stasiun).`;

    el.rute.style.setProperty("--jeda", Math.min(25, 700 / data.rute.length) + "ms");
    el.rute.replaceChildren(
      ...data.rute.map((nama, i) => buatItemRute(nama, i, data.rute.length))
    );

    el.legendaTambahanWrap.hidden = data.stasiun_tambahan === 0;
    el.hasil.hidden = false;
  }

  async function hitung() {
    const asal = el.asal.value;
    const tujuan = el.tujuan.value;

    if (!asal || !tujuan) return tampilkanKosong();
    if (asal === tujuan) {
      return tampilkanPesan("Stasiun asal dan tujuan sama. Pilih tujuan yang berbeda.");
    }

    const saya = ++permintaanKe;
    try {
      const res = await fetch("/api/hitung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asal, tujuan }),
      });
      const data = await res.json();
      if (saya !== permintaanKe) return;
      if (!res.ok) return tampilkanPesan(data.error || "Terjadi kesalahan.");
      tampilkanHasil(data);
    } catch {
      tampilkanPesan("Tidak bisa terhubung ke server. Coba lagi.");
    }
  }

  function tukarStasiun() {
    [el.asal.value, el.tujuan.value] = [el.tujuan.value, el.asal.value];
    el.tukar.classList.toggle("putar");
    hitung();
  }

  async function mulai() {
    try {
      const res = await fetch("/api/stasiun");
      const data = await res.json();
      aturan = data.aturan;

      isiPilihan(el.asal, data.stasiun, "Pilih stasiun asal");
      isiPilihan(el.tujuan, data.stasiun, "Pilih stasiun tujuan");

      el.aturan.textContent =
        `${aturan.batas} stasiun pertama ${rupiah(aturan.tarif_dasar)}, ` +
        `setiap stasiun berikutnya +${rupiah(aturan.tarif_tambahan)}.`;
      el.legendaDasar.textContent = `Tarif dasar (${aturan.batas} stasiun pertama)`;
      el.legendaTambahan.textContent = `Tambahan ${rupiah(aturan.tarif_tambahan)} per stasiun`;

      el.asal.addEventListener("change", hitung);
      el.tujuan.addEventListener("change", hitung);
      el.tukar.addEventListener("click", tukarStasiun);
    } catch {
      tampilkanPesan("Daftar stasiun gagal dimuat. Muat ulang halaman.");
    }
  }

  mulai();
})();
