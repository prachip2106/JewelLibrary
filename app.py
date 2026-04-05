## FILE LOAD CHECK
print("app.py IS LOADED")


# IMPORT
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os


# APP INIT
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# PATH SETUP
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "dataset_raw"))


# STATIC FILES (IMAGES)
app.mount(
    "/images",
    StaticFiles(directory=DATASET_DIR),
    name="images"
)

# ROOT CHECK
@app.get("/")
def home():
    return {"message": "JewelLibrary backend running"}


# GET ALL CATEGORIES
@app.get("/api/categories")
def get_categories():
    return {
        "categories": [
            folder for folder in os.listdir(DATASET_DIR)
            if os.path.isdir(os.path.join(DATASET_DIR, folder))
        ]
    }


# MAIN API (SEARCH + PAGINATION)
@app.get("/api/jewelry")
def get_jewelry(category: str = "", search: str = "", page: int = 1, limit: int = 9):

    category = category.lower().strip()
    search   = search.lower().strip()

    all_cats = sorted([
        folder for folder in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, folder))
    ])

    # Build a dict of { cat: [items...] } for matched categories
    buckets = {}

    for cat in all_cats:
        cat_lower = cat.lower()

        # Category pill: exact match
        if category != "" and cat_lower != category:
            continue

        # Search box: singular/plural safe, category-level only
        if search != "" and cat_lower.rstrip("s") != search.rstrip("s"):
            continue

        items = []
        folder = os.path.join(DATASET_DIR, cat)
        for file in sorted(os.listdir(folder)):
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                items.append({
                    "name": file,
                    "type": cat,
                    "image_url": f"/images/{cat}/{file}"
                })
        if items:
            buckets[cat] = items

    # ── INTERLEAVE: round-robin across all matched categories ──
    # This ensures every page shows a mix of types, not all-bracelets then all-earrings
    results = []
    if buckets:
        iters = {cat: iter(items) for cat, items in buckets.items()}
        active = list(buckets.keys())
        while active:
            for cat in list(active):
                item = next(iters[cat], None)
                if item:
                    results.append(item)
                else:
                    active.remove(cat)

    total = len(results)

    # PAGINATION
    start = (page - 1) * limit
    end   = start + limit

    return {
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit if total > 0 else 1,
        "data": results[start:end]
    }
