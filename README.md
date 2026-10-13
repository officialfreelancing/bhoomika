# HouseKeep Shimoga

A responsive home-services booking website for Shimoga, Karnataka. The frontend is a React/Vite single-page app and the REST API is a Flask service backed by a JSON file.

## Run locally

### API

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py app.py
```

The API listens on `http://localhost:5000` and stores bookings and contact messages in `backend/housekeep.json`. Set `HOUSEKEEP_JSON` to use a different JSON file. If `backend/housekeep.json` does not exist but the old `backend/housekeep.sqlite3` does, the API imports its records into the JSON file on startup; the SQLite file is left unchanged.

### Frontend

From the project root:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend uses `http://localhost:5000` by default; set `VITE_API_BASE_URL` before starting Vite to point it at another API URL.

## API

- `GET /api/services` — list services as a JSON array with `id`, `name`, `icon`, `price`, `unit`, `category`, and `description`; optionally filter with `?category=cleaning`, `shifting`, `repairs`, or `other`.
- `POST /api/book` — validate and save a booking.
- `GET /api/bookings` — list bookings.
- `PUT /api/bookings/<id>/status` — update to `pending`, `confirmed`, `completed`, or `cancelled`.
- `POST /api/contact` — save a contact message.

The API allows cross-origin requests from `http://localhost:3000`.
