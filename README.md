# Manufacturing QR Inventory

Full-stack manufacturing inventory management system with QR-based sales tracking.

## Architecture

```
Manufacturing_QR/
├── backend/          # Python (FastAPI) REST API
│   ├── app/          # Application code
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React (Vite) Frontend
│   ├── src/
│   │   ├── api/      # Axios API client
│   │   ├── components/ # Reusable UI components
│   │   ├── context/  # React contexts (Toast)
│   │   └── pages/    # Page components
│   └── package.json
└── README.md
```

## Features

- **Dashboard** — Admin metrics, stock per shop, alerts
- **Sections** — Organize products into manufacturing sections
- **Products** — Catalog with CGST/SGST price calculation
- **Shops** — Retail shop management with stock alerts
- **Distribution** — Distribute units with unique serial numbers and QR tokens
- **QR Scanner** — Scan QR token to mark a unit as sold
- **Inventory** — View shop inventory by section, check product availability
- **Email Alerts** — Low-stock and out-of-stock notifications via Brevo

## Quick Start

### Backend (Python)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Fill in MongoDB + Brevo credentials
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name (default: `manufacturing_qr`) |
| `BREVO_API_KEY` | Brevo API key for email alerts |
| `ADMIN_TOKEN` | Admin auth token for protected endpoints |
| `QR_BASE_URL` | Base URL for QR scan links |

The frontend uses `VITE_API_URL` (defaults to `http://localhost:8000`).

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/sections` | Admin | Create a section |
| GET | `/sections` | — | List sections (paginated) |
| POST | `/products` | Admin | Create a product |
| GET | `/products` | — | List products (paginated) |
| POST | `/shops` | Admin | Create a shop |
| GET | `/shops` | — | List shops (paginated) |
| POST | `/distribute` | Admin | Distribute products to a shop |
| GET | `/scan/{token}` | — | Scan QR and complete sale |
| GET | `/shop/{id}/inventory` | — | Shop inventory by section |
| GET | `/shop/{id}/availability/{pid}` | — | Product availability check |
| GET | `/dashboard/admin` | Admin | Admin dashboard metrics |
