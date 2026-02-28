# Thrift Store Backend API Documentation

## Base URL

http://localhost:5000

---

## Authentication APIss

### Register User

POST /api/auth/register  
Body:
{
"email": "user@gmail.com",
"password": "123456"
}

### Login User

POST /api/auth/login  
Body:
{
"email": "user@gmail.com",
"password": "123456"
}

---

## Product APIs (Thrift Items)

### Get All Products

GET /api/products

### Add New Product

POST /api/products/add  
Body:
{
"name": "White Top",
"price": 500,
"size": "S"
}

### Get Product by ID

GET /api/products/:id

---

## Search APIs (ML + Filters)

### Text Search

GET /api/search/text?q=keyword  
Example:
GET /api/search/text?q=white halterneck top

### Image Search (Future ML Integration)

POST /api/search/image  
Form-Data:
image: (file upload)

---

## Cart APIs

### Get Cart Items

GET /api/cart

### Add Item to Cart

POST /api/cart/add

### Remove Item from Cart

DELETE /api/cart/remove/:id

---

## Tech Stack

- Node.js
- Express.js
- MongoDB (Planned)
- Multer (Image Upload - Planned)
- ML Image Search (Planned)
