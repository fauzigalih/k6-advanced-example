# K6 Performance Testing

Project ini digunakan untuk melakukan performance testing API menggunakan Grafana K6.

## Prerequisites

Pastikan software berikut sudah terinstall:

* K6 Grafana
* Node.js

Verifikasi instalasi:

```bash
k6 version
node -v
npm -v
```

---

## Project Structure

```text
.
├── tests/
│   └── *.js
├── helpers/
│   └── *.js
├── data/
│   └── *.json
│   └── *.csv
├── results/
│   └── *.json
├── node_modules
├── package.json
└── README.md
```

### Folder Description

| Folder | Description |
|----------|----------|
| `tests` | Menyimpan seluruh file test case K6 |
| `helpers` | Menyimpan helper function dan HTTP request |
| `data` | Menyimpan test data seperti JSON, CSV, payload request, dan configuration |
| `results` | Menyimpan hasil execution test dan summary report |

---

## Installation

Clone repository:

```bash
git clone <repository-url>
cd <project-name>
```

Install dependency Node.js:

```bash
npm install
```

---

## Run Test

### Running K6 Test

```bash
k6 run tests/shared-array.js
```
```bash
k6 run tests/data-driven.js
```
```bash
k6 run tests/metrics.js
```
```bash
k6 run tests/realistic-user-flow.js
```
---

## Results

Semua hasil execution test disimpan pada folder:

```text
results/
```

Contoh file hasil:

```text
results/summary.json
results/summary.html
```

---

## Best Practice

* Simpan seluruh script test pada folder `tests`.
* Simpan seluruh request API dan helper function pada folder `helpers`.
* Simpan seluruh hasil testing pada folder `results`.
* Pisahkan test berdasarkan fitur atau endpoint API.
* Jalankan satu per satu test pada folder `tests`.

---

## Task Description

Kamu adalah QA Engineer di sebuah platform e-commerce. Tim memintamu membuat load test yang realistis — artinya setiap VU harus berperilaku seperti user nyata yang berbeda-beda, bukan semua VU mengirim data yang sama.

Target API: https://jsonplaceholder.typicode.com

### 1. Buat data fixture dengan SharedArray

Siapkan data test dari file JSON menggunakan SharedArray — bukan hardcode di dalam script. Data di-load sekali, dibagi ke semua VU tanpa duplikasi memori.

* Buat file data/users.json berisi minimal 20 user dengan field: userId, name, email
* Load data tersebut dengan SharedArray dari k6/data
* Setiap VU mengambil data user berbeda berdasarkan __VU index
* Pastikan tidak ada dua VU yang pakai data user yang sama di waktu bersamaan

`SharedArray` `k6/data` `__VU`

### 2. Data-driven POST request dari CSV

Selain JSON, load test data dari file CSV menggunakan SharedArray + manual parsing. Simulasikan user membuat post dengan judul dan body yang berbeda-beda.

* Buat file data/posts.csv berisi minimal 20 baris: title,body,userId
* Parse CSV secara manual (tanpa library eksternal) di dalam SharedArray
* Setiap iterasi mengambil baris CSV yang berbeda dengan __ITER
* Tambahkan check: response body mengandung title yang sama dengan yang dikirim

`CSV parsing` `__ITER` `dynamic payload`

### 3. Custom metrics — ukur hal yang bermakna

Threshold bawaan k6 sudah bagus, tapi QA engineer senior tahu cara membuat metric sendiri untuk mengukur hal yang lebih spesifik sesuai bisnis.

* Buat Trend metric khusus untuk durasi POST request saja
* Buat Rate metric untuk persentase response yang mengandung field id
* Buat Counter metric untuk total request yang gagal
* Semua custom metric muncul di summary output 

`Trend` `Rate` `Counter` `custom metrics`

### 4. Realistic user flow — satu VU, banyak langkah

Gabungkan semua di atas ke dalam satu flow yang mensimulasikan perjalanan user nyata: ambil list post → baca detail post → buat post baru. Setiap langkah pakai data dari SharedArray.

* Step 1: GET /posts
— ambil list, ambil satu post random dari response
* Step 2: GET /posts/{id}
— baca detail post yang didapat dari step 1
* Step 3: POST /posts
— buat post baru dengan data dari CSV
* Tambahkan sleep
realistis antar step (1–3 detik random)
* Seluruh flow wrapped dalam satu group bernama user journey

`group()` `user journey` `chained requests` `Math.random()`

### 5. handleSummary — laporan custom HTML

Hasil test disimpan tidak hanya sebagai JSON, tapi juga sebagai file HTML yang bisa langsung dibuka di browser — layaknya laporan yang bisa dikasih ke manager.

* Export handleSummary
yang menghasilkan
results/summary.json
dan results/summary.html
* File HTML minimal menampilkan: total requests, pass/fail threshold, p95 duration
* Tidak perlu styling mewah — tabel HTML sederhana sudah cukup

`handleSummary` `HTML report` `textSummary`

Note: Tantangan terbesar di task ini adalah task 2 — parsing CSV manual tanpa library. Hint: open('data/posts.csv') mengembalikan string, split per \n, lalu split per ,. Tapi hati-hati dengan baris header dan trailing newline.

---

## Author

Fauzi Galih
