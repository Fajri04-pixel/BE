# HP Market API — Panduan Postman

Base URL: `http://localhost:5000`

---

## 1. Login Admin (dapatkan token)

**POST** `/api/auth/login`  
Body → `raw JSON`:
```json
{
  "email": "admin@hpmarket.com",
  "password": "admin123"
}
```
Salin `token` dari response untuk request berikutnya.

---

## 2. Tambah Produk + Foto

**POST** `/api/products`  
Headers:
```
Authorization: Bearer <token_admin>
```
Body → **form-data**:

| Key             | Type | Value |
|-----------------|------|-------|
| product_name    | Text | iPhone 15 Pro Max |
| brand           | Text | Apple |
| price           | Text | 22000000 |
| stock           | Text | 10 |
| description     | Text | HP premium terbaru |
| specifications  | Text | RAM 8GB, 256GB |
| image           | File | *pilih file gambar* |

> Field `image` harus **Type: File**, bukan Text.

---

## 3. Update Produk + Foto Baru

**PUT** `/api/products/:id`  
Headers:
```
Authorization: Bearer <token_admin>
```
Body → **form-data** (sama seperti POST, isi `image` kalau mau ganti foto)

---

## 4. Hapus Produk

**DELETE** `/api/products/:id`  
Headers:
```
Authorization: Bearer <token_admin>
```

---

## 5. Lihat Semua Produk

**GET** `/api/products`  
*(tidak perlu token)*

Dengan search:
```
GET /api/products?search=iphone
```

---

## 6. Dashboard Admin

**GET** `/api/admin/dashboard`  
Headers:
```
Authorization: Bearer <token_admin>
```

---

## 7. Lihat Semua Transaksi

**GET** `/api/admin/transactions`  
Headers:
```
Authorization: Bearer <token_admin>
```

---

## 8. Update Status Transaksi

**PUT** `/api/admin/transactions/:id/status`  
Headers:
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```
Body → `raw JSON`:
```json
{
  "status": "paid"
}
```
Status valid: `pending` | `paid` | `shipped` | `completed` | `cancelled`

---

## 9. Lihat Semua User

**GET** `/api/users`  
Headers:
```
Authorization: Bearer <token_admin>
```

---

## 10. Hapus User

**DELETE** `/api/admin/users/:id`  
Headers:
```
Authorization: Bearer <token_admin>
```

---

## Akses Foto

Foto yang diupload bisa diakses di:
```
http://localhost:5000/uploads/<nama_file>
```
Field `image_url` di response produk sudah berisi URL lengkap.

---

## 11. Upload File (Dokumen, Bukti Pembayaran, Foto, dll)

**POST** `/api/upload`  
Headers:
```
Authorization: Bearer <token_user>
```
Body → **form-data**:

| Key  | Type | Value |
|------|------|-------|
| file | File | *pilih file gambar atau dokumen* |

Supported format: `jpg, jpeg, png, gif, webp`  
Max size: **5 MB**

Response:
```json
{
  "success": true,
  "message": "File berhasil diupload",
  "data": {
    "filename": "product-1234567890.jpg",
    "originalname": "bukti_pembayaran.jpg",
    "size": 156789,
    "url": "/uploads/product-1234567890.jpg",
    "mimetype": "image/jpeg"
  }
}
```

---

## 12. Upload File Admin

**POST** `/api/admin/upload`  
Headers:
```
Authorization: Bearer <token_admin>
```
Body → **form-data** (sama seperti endpoint `/api/upload`)

---

## 13. Detail Transaksi (Admin) - Lihat Alamat & Nomor Telepon

**GET** `/api/admin/transactions/:id`  
Headers:
```
Authorization: Bearer <token_admin>
```

Response akan include:
- `user_phone`: Nomor telepon pengirim
- `user_address`: Alamat pengirim
- `sender_phone`: Alias untuk nomor telepon pengirim
- `sender_address`: Alias untuk alamat pengirim
- `items`: Daftar produk yang dipesan
- dll
