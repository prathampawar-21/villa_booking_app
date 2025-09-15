// server.js

// Import necessary packages
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

// Initialize the Express app
const app = express();
// Use environment variable for PORT, fallback to 3000 for local dev
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Parses incoming JSON requests

// Define the path for the database file
const dbPath = path.join(__dirname, 'villalux.db');

// Connect to the SQLite database.
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error connecting to the database:", err.message);
    } else {
        console.log("Successfully connected to the SQLite database 'villalux.db'.");
        setupDatabase();
    }
});

// --- Database Setup Function ---
function setupDatabase() {
    db.serialize(() => {
        // Create the villas table
        db.run(`CREATE TABLE IF NOT EXISTS villas (
            villa_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            price_per_night INTEGER NOT NULL,
            rating REAL,
            image_url TEXT
        )`, (err) => {
            if (err) {
                console.error("Error creating villas table:", err.message);
                return;
            }
            // Check if the table is empty before inserting data
            db.get("SELECT COUNT(*) as count FROM villas", (err, row) => {
                if (row && row.count === 0) {
                    console.log("Villas table is empty, inserting initial data...");
                    const villasData = [
                        { name: 'Serenity Cliff Villa', location: 'Uluwatu, Bali', price_per_night: 750, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'Jungle Oasis Retreat', location: 'Ubud, Bali', price_per_night: 620, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'The Rice Paddy View', location: 'Canggu, Bali', price_per_night: 550, rating: 4.7, image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1938' },
                        { name: 'Volcano View Lodge', location: 'Kintamani, Bali', price_per_night: 680, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&q=80&w=1974' },
                        { name: 'Azure Dreamhouse', location: 'Santorini, Greece', price_per_night: 980, rating: 5.0, image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'Caldera Edge Suite', location: 'Santorini, Greece', price_per_night: 1100, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16e?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'White Pearl Villa', location: 'Santorini, Greece', price_per_night: 920, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'Aegean Sunset Villa', location: 'Santorini, Greece', price_per_night: 1250, rating: 5.0, image_url: 'https://images.unsplash.com/photo-1590490359838-3486a4225853?auto=format&fit=crop&q=80&w=1954' },
                        { name: 'The Glass Pavilion', location: 'Malibu, California', price_per_night: 1200, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'Oceanfront Modern', location: 'Malibu, California', price_per_night: 1500, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'Hillside Architectural', location: 'Malibu, California', price_per_night: 1350, rating: 4.7, image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'Zuma Beach House', location: 'Malibu, California', price_per_night: 1600, rating: 5.0, image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=2070' },
                        { name: 'Coastal Hideaway', location: 'Malibu, California', price_per_night: 1100, rating: 4.6, image_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=2070' }
                    ];
                    const stmt = db.prepare("INSERT INTO villas (name, location, price_per_night, rating, image_url) VALUES (?, ?, ?, ?, ?)");
                    villasData.forEach(villa => stmt.run(villa.name, villa.location, villa.price_per_night, villa.rating, villa.image_url));
                    stmt.finalize();
                    console.log("Initial villa data inserted.");
                }
            });
        });

        // Create the customers table
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        )`);

        // Create the bookings table
        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_confirmation_id TEXT NOT NULL UNIQUE,
            customer_id INTEGER,
            villa_id INTEGER,
            arrival_date TEXT NOT NULL,
            departure_date TEXT NOT NULL,
            guests INTEGER NOT NULL,
            special_requests TEXT,
            booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
            FOREIGN KEY (villa_id) REFERENCES villas (villa_id)
        )`);
    });
}

// --- API Routes ---

// GET: Fetch all villas (or filter by location)
app.get('/api/villas', (req, res) => {
    const location = req.query.location;
    let sql = "SELECT * FROM villas";
    const params = [];

    if (location) {
        sql += " WHERE location LIKE ?";
        params.push('%' + location + '%');
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// POST: Create a new booking
app.post('/api/bookings', (req, res) => {
    const { bookingId, villa, arrivalDate, departureDate, fullName, email, guests, requests } = req.body;

    db.serialize(() => {
        let villaId;
        let customerId;

        db.get("SELECT villa_id FROM villas WHERE name = ?", [villa], (err, row) => {
            if (err || !row) {
                return res.status(400).json({ "error": "Villa not found." });
            }
            villaId = row.villa_id;

            db.get("SELECT customer_id FROM customers WHERE email = ?", [email], (err, row) => {
                if (row) { 
                    customerId = row.customer_id;
                    insertBooking();
                } else { 
                    db.run("INSERT INTO customers (full_name, email) VALUES (?, ?)", [fullName, email], function(err) {
                        if (err) return res.status(500).json({ "error": err.message });
                        customerId = this.lastID;
                        insertBooking();
                    });
                }
            });
        });

        function insertBooking() {
            const sql = `INSERT INTO bookings (booking_confirmation_id, customer_id, villa_id, arrival_date, departure_date, guests, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const params = [bookingId, customerId, villaId, arrivalDate, departureDate, guests, requests];
            db.run(sql, params, function(err) {
                if (err) {
                    return res.status(500).json({ "error": err.message });
                }
                res.status(201).json({ "message": "Booking successful!", "bookingId": this.lastID });
            });
        }
    });
});

// --- Serve the Frontend ---
// This tells Express to serve all static files in the current directory
app.use(express.static(__dirname));

// A route for the root path to send index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`VillaLux server with SQLite listening at http://localhost:${PORT}`);
});

