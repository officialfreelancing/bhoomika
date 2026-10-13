import json
import os
import re
import sqlite3
import tempfile
from datetime import date, datetime
from threading import RLock

from flask import Flask, jsonify, request
from flask_cors import CORS


SERVICES = [
    {"id": 1, "name": "Full Home Deep Cleaning", "icon": "🏠", "price": 1499, "unit": "starting", "category": "cleaning", "description": "Complete deep cleaning of bedrooms, hall, kitchen & bathrooms with professional equipment."},
    {"id": 2, "name": "Bathroom Cleaning", "icon": "🚿", "price": 199, "unit": "starting", "category": "cleaning", "description": "Tile scrubbing, stain removal, sanitisation of toilets, sinks and fittings."},
    {"id": 3, "name": "Kitchen Cleaning", "icon": "🍳", "price": 399, "unit": "starting", "category": "cleaning", "description": "Make your counters, cabinets and cooking space shine again."},
    {"id": 4, "name": "Sofa & Carpet Cleaning", "icon": "🛋️", "price": 299, "unit": "starting", "category": "cleaning", "description": "Lift dust and stains from your favorite soft furnishings."},
    {"id": 5, "name": "House Shifting (Local)", "icon": "📦", "price": 1999, "unit": "starting", "category": "shifting", "description": "A smooth, careful move to your new home in Shimoga."},
    {"id": 6, "name": "Packing Services Only", "icon": "🎁", "price": 799, "unit": "starting", "category": "shifting", "description": "Professionally packed belongings, ready for your move."},
    {"id": 7, "name": "Plumbing Repairs", "icon": "🚰", "price": 149, "unit": "starting", "category": "repairs", "description": "Leaky taps, clogged drains and plumbing fixes handled."},
    {"id": 8, "name": "Electrician Services", "icon": "💡", "price": 149, "unit": "starting", "category": "repairs", "description": "Safe help with switches, fans, wiring and electrical faults."},
    {"id": 9, "name": "Carpenter Services", "icon": "🪚", "price": 199, "unit": "starting", "category": "repairs", "description": "Furniture fixes and fittings from a skilled local carpenter."},
    {"id": 10, "name": "Appliance Repair", "icon": "🔧", "price": 249, "unit": "starting", "category": "repairs", "description": "Get everyday home appliances checked and working again."},
    {"id": 11, "name": "Home Painting", "icon": "🎨", "price": 999, "unit": "starting", "category": "other", "description": "Freshen up your walls with tidy, professional painting."},
    {"id": 12, "name": "Pest Control", "icon": "🐜", "price": 799, "unit": "starting", "category": "other", "description": "Targeted treatments to help keep unwanted pests away."},
    {"id": 13, "name": "Cook & Maid Services", "icon": "👩‍🍳", "price": 299, "unit": "day", "category": "other", "description": "Find dependable daily help for cooking and household tasks."},
    {"id": 14, "name": "Gardening & Plants", "icon": "🪴", "price": 299, "unit": "starting", "category": "other", "description": "Give your garden and indoor plants the care they deserve."},
]

REQUIRED_BOOKING_FIELDS = (
    "name",
    "phone",
    "address",
    "preferred_date",
    "time_slot",
)
VALID_STATUSES = {"pending", "confirmed", "completed", "cancelled"}
STORE_LOCK = RLock()


app = Flask(__name__)
app.config["JSON_STORE"] = os.environ.get(
    "HOUSEKEEP_JSON",
    os.path.join(os.path.dirname(__file__), "housekeep.json"),
)
app.config["LEGACY_DATABASE"] = os.environ.get(
    "HOUSEKEEP_DATABASE",
    os.path.join(os.path.dirname(__file__), "housekeep.sqlite3"),
)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})


def read_legacy_database(path):
    connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        bookings = [dict(row) for row in connection.execute("SELECT * FROM bookings")]
        messages = [
            dict(row) for row in connection.execute("SELECT * FROM contact_messages")
        ]
    finally:
        connection.close()

    return {
        "bookings": bookings,
        "contact_messages": messages,
        "next_ids": {
            "bookings": max((row["id"] for row in bookings), default=0) + 1,
            "contact_messages": max((row["id"] for row in messages), default=0) + 1,
        },
    }


def save_store(store):
    path = app.config["JSON_STORE"]
    directory = os.path.dirname(os.path.abspath(path))
    os.makedirs(directory, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=directory, delete=False
        ) as temporary_file:
            temporary_path = temporary_file.name
            json.dump(store, temporary_file, ensure_ascii=False, indent=2)
            temporary_file.write("\n")
        os.replace(temporary_path, path)
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)


def load_store():
    with open(app.config["JSON_STORE"], encoding="utf-8") as store_file:
        return json.load(store_file)


def init_store():
    path = app.config["JSON_STORE"]
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    if os.path.exists(path):
        load_store()
        return

    legacy_path = app.config["LEGACY_DATABASE"]
    if os.path.exists(legacy_path):
        store = read_legacy_database(legacy_path)
    else:
        store = {
            "bookings": [],
            "contact_messages": [],
            "next_ids": {"bookings": 1, "contact_messages": 1},
        }
    save_store(store)


init_store()


def json_object():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None
    return data


def clean_text(data, field):
    value = data.get(field, "")
    return value.strip() if isinstance(value, str) else ""


def valid_phone(phone):
    return bool(re.fullmatch(r"\d{10}", phone))


@app.get("/api/services")
def list_services():
    category = request.args.get("category")
    if category:
        return jsonify([service for service in SERVICES if service["category"] == category])
    return jsonify(SERVICES)


@app.post("/api/book")
def create_booking():
    data = json_object()
    if data is None:
        return jsonify({"error": "Request body must be a JSON object."}), 400

    missing = [field for field in REQUIRED_BOOKING_FIELDS if not clean_text(data, field)]
    if missing:
        return jsonify({"error": f"Please provide all required fields: {', '.join(missing)}."}), 400

    phone = clean_text(data, "phone")
    if not valid_phone(phone):
        return jsonify({"error": "Phone number must contain exactly 10 digits."}), 400

    email = clean_text(data, "email")
    if email and ("@" not in email or "." not in email.rsplit("@", 1)[-1]):
        return jsonify({"error": "Please provide a valid email address."}), 400

    try:
        service_id = int(data.get("service_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Please select a valid service."}), 400
    service = next((item for item in SERVICES if item["id"] == service_id), None)
    if service is None:
        return jsonify({"error": "Please select a valid service."}), 400

    try:
        service_date = date.fromisoformat(clean_text(data, "preferred_date"))
    except ValueError:
        return jsonify({"error": "Please provide a valid service date."}), 400
    if service_date < date.today():
        return jsonify({"error": "Service date cannot be in the past."}), 400

    time_slot = clean_text(data, "time_slot")
    if time_slot not in {
        "8:00 AM – 10:00 AM",
        "10:00 AM – 12:00 PM",
        "12:00 PM – 2:00 PM",
        "2:00 PM – 4:00 PM",
        "4:00 PM – 6:00 PM",
        "6:00 PM – 8:00 PM",
    }:
        return jsonify({"error": "Please select a valid time slot."}), 400

    booking = {
        "name": clean_text(data, "name"),
        "phone": phone,
        "email": email or None,
        "service_id": service_id,
        "address": clean_text(data, "address"),
        "preferred_date": service_date.isoformat(),
        "time_slot": time_slot,
        "instructions": clean_text(data, "instructions"),
    }
    with STORE_LOCK:
        store = load_store()
        booking_id = store["next_ids"]["bookings"]
        store["bookings"].append(
            {
                **booking,
                "id": booking_id,
                "service_name": service["name"],
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            }
        )
        store["next_ids"]["bookings"] += 1
        save_store(store)

    return jsonify(
        {
            "message": "Booking received. Our HouseKeep team will call you shortly.",
            "booking_id": booking_id,
            "status": "pending",
        }
    ), 201


@app.get("/api/bookings")
def list_bookings():
    with STORE_LOCK:
        bookings = load_store()["bookings"]
    return jsonify(
        sorted(
            bookings,
            key=lambda row: (row["created_at"], row["id"]),
            reverse=True,
        )
    )


@app.put("/api/bookings/<int:booking_id>/status")
def update_booking_status(booking_id):
    data = json_object()
    if data is None:
        return jsonify({"error": "Request body must be a JSON object."}), 400
    status = clean_text(data, "status").lower()
    if status not in VALID_STATUSES:
        return jsonify({"error": "Status must be pending, confirmed, completed, or cancelled."}), 400

    with STORE_LOCK:
        store = load_store()
        booking = next(
            (row for row in store["bookings"] if row["id"] == booking_id), None
        )
        if booking is None:
            return jsonify({"error": "Booking not found."}), 404
        booking["status"] = status
        save_store(store)
    return jsonify(
        {"message": "Booking status updated.", "booking_id": booking_id, "status": status}
    )


@app.post("/api/contact")
def create_contact_message():
    data = json_object()
    if data is None:
        return jsonify({"error": "Request body must be a JSON object."}), 400
    name = clean_text(data, "name")
    phone = clean_text(data, "phone")
    email = clean_text(data, "email")
    message = clean_text(data, "message")
    if not name or not phone or not message:
        return jsonify({"error": "Name, phone, and message are required."}), 400
    if not valid_phone(phone):
        return jsonify({"error": "Phone number must contain exactly 10 digits."}), 400
    if email and ("@" not in email or "." not in email.rsplit("@", 1)[-1]):
        return jsonify({"error": "Please provide a valid email address."}), 400

    with STORE_LOCK:
        store = load_store()
        message_id = store["next_ids"]["contact_messages"]
        store["contact_messages"].append(
            {
                "id": message_id,
                "name": name,
                "phone": phone,
                "email": email or None,
                "message": message,
                "created_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            }
        )
        store["next_ids"]["contact_messages"] += 1
        save_store(store)
    return jsonify(
        {"message": "Your message has been received.", "message_id": message_id}
    ), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
