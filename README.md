# JewelLibrary

## Overview

A full-stack Jewelry Gallery web application that displays different types of jewelry in a clean and interactive interface. Users can search items, browse categories, and navigate using pagination.

---

## Features

* Search jewelry items (ring, necklace, earrings, etc.)
* Image gallery display
* Category-based filtering
* Pagination support
* FastAPI backend with REST APIs
* Simple and responsive frontend (HTML, CSS, JavaScript)

---

##  Tech Stack

Backend: FastAPI (Python)
Frontend: HTML, CSS, JavaScript

---

## Project Structure

JewelLibrary/
│── backend/
│   └── app.py
│
│── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│
│── .gitignore
│── README.md

---

## How to Run

### 1. Start Backend

cd backend
uvicorn app:app --reload

Backend will run at:
http://127.0.0.1:8000

---

### 2. Open Frontend

Open `frontend/index.html` in your browser.

---

## 🔗 API Endpoints

* `/api/jewelry` → Get all items
* `/api/jewelry?search=ring` → Search items
* `/api/jewelry?page=2` → Pagination
* `/api/categories` → Get categories

---

## ⚠️ Note

* Dataset is not included due to large size
* Images are served locally via backend
* To run the project, place images inside a folder named `dataset_raw` with category-wise subfolders (rings, necklaces, etc.).

---

## 📸 Screenshot

!![Homepage](frontend/assets/index.png)

---

## Author

Internship Project
Prachi Patel