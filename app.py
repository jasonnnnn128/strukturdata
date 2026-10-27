from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

STASIUN = [
    "Jakarta Kota", "Jayakarta", "Mangga Besar", "Sawah Besar", "Juanda",
    "Gondangdia", "Cikini", "Manggarai", "Tebet", "Cawang",
    "Duren Kalibata", "Pasar Minggu Baru", "Pasar Minggu", "Tanjung Barat",
    "Lenteng Agung", "Universitas Pancasila", "Universitas Indonesia",
    "Pondok Cina", "Depok Baru", "Depok", "Citayam", "Bojong Gede",
    "Cilebut", "Bogor",
]

ATURAN = {
    "batas": 5,
    "tarif_dasar": 3000,
    "tarif_tambahan": 500,
}


def hitung_tarif(jumlah: int) -> int:
    """3.000 untuk 5 stasiun pertama, lalu +500 untuk tiap stasiun berikutnya."""
    if jumlah <= 0:
        return 0
    tambahan = max(0, jumlah - ATURAN["batas"])
    return ATURAN["tarif_dasar"] + tambahan * ATURAN["tarif_tambahan"]


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/stasiun")
def api_stasiun():
    return jsonify(stasiun=STASIUN, aturan=ATURAN)


@app.post("/api/hitung")
def api_hitung():
    data = request.get_json(silent=True) or {}
    asal, tujuan = data.get("asal"), data.get("tujuan")

    if asal not in STASIUN or tujuan not in STASIUN:
        return jsonify(error="Pilih stasiun asal dan tujuan."), 400
    if asal == tujuan:
        return jsonify(error="Stasiun asal dan tujuan sama. Pilih tujuan yang berbeda."), 400

    i, j = STASIUN.index(asal), STASIUN.index(tujuan)
    jumlah = abs(j - i)
    rute = STASIUN[i:j + 1] if j > i else STASIUN[j:i + 1][::-1]
    tambahan = max(0, jumlah - ATURAN["batas"])

    return jsonify(
        jumlah=jumlah,
        tarif=hitung_tarif(jumlah),
        stasiun_tambahan=tambahan,
        biaya_tambahan=tambahan * ATURAN["tarif_tambahan"],
        rute=rute,
    )


if __name__ == "__main__":
    app.run(debug=True)
