# DYNAMIS - IoT Energy Management System

A full-stack **real-time energy monitoring and control system** for households. Monitor power consumption, track costs, detect motion, control smart devices, and receive intelligent alerts via a modern web dashboard.

**Live Demo Available** | Users can test without hardware setup

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Database Schema](#database-schema)
- [Hardware Integration](#hardware-integration)
- [API Endpoints](#api-endpoints)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**MPC Dashboard** is an integrated IoT energy management platform that combines:

- **Real-time Power Monitoring** — Live consumption tracking for your entire home
- **Smart Device Control** — Toggle relays, manage appliances remotely
- **Motion Detection** — PIR sensors integrated for security & automation
- **NILM Technology** — Non-Intrusive Load Monitoring (detect individual appliances)
- **Cost Analysis** — Track spending based on tariff rates
- **Multi-user Support** — Admin & user roles with per-home isolation
- **Demo Mode** — Test without hardware or database setup

### Key Use Cases

1. **Home Owners** — Monitor energy usage, reduce bills, understand consumption patterns,compare bills to the existing system
2. **Admins** — Manage multiple homes, users, and system-wide analytics
3. **Developers** — Open API for integrations, extensible firmware & services

---

## 🏗️ Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HARDWARE LAYER                           │
├──────────────┬──────────────────┬──────────────┬────────────┤
│  Arduino Uno │  ESP8266 WiFi    │   LDR        │   PIR      │
│  (Relay Ctrl)│  (Motion Sensor) │  (Light)     │  (Motion)  │
└──────────────┴──────────────────┴──────────────┴────────────┘
                           ↓
                   ┌────────────────┐
                   │  MQTT Broker   │
                   │ (Local/Cloud)  │
                   └────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Arduino Serial Bridge                          │
│         (Serial → MQTT Protocol Converter)                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   NODE.JS SERVER                            │
├──────────────────────────────────────────────────────────────┤
│  Express API          │  Socket.io Real-time              │
│  ├── /api/auth        │  ├── Power updates               │
│  ├── /api/home        │  ├── Device state changes        │
│  └── /api/admin       │  └── Alert notifications         │
├──────────────────────────────────────────────────────────────┤
│  Services                                                   │
│  ├── Power Estimator   ├── NILM Service                   │
│  ├── Motion Service    ├── LDR Service                    │
│  ├── Demo Replay       └── Alert Manager                  │
├──────────────────────────────────────────────────────────────┤
│  Databases                                                  │
│  ├── PostgreSQL       │  ├── InfluxDB (Time-series)       │
│  │   (Users, Homes)   │  │   (Power, Voltage data)        │
│  │   (Devices, Rules) │  │   (Historical analytics)       │
│  └── (Alerts)         │  └── (Performance tuned)          │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               REACT WEB DASHBOARD                           │
├──────────────────────────────────────────────────────────────┤
│  Landing Page     │  User Dashboard  │  Admin Panel       │
│  ├── Register     │  ├── Power Meter │  ├── Users         │
│  ├── Login        │  ├── Usage Charts│  ├── Devices       │
│  └── Demo         │  ├── Cost Tracks │  ├── Analytics     │
│                   │  ├── Alerts      │  ├── Alerts        │
│                   │  ├── Devices     │  └── Settings      │
│                   │  └── Settings    │                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Zustand, Socket.io, Recharts |
| **Backend** | Node.js, Express, Socket.io, MQTT 5.x |
| **Authentication** | JWT + bcryptjs |
| **Validation** | Joi schema validation |
| **Databases** | PostgreSQL (relational), InfluxDB (time-series) |
| **Hardware** | Arduino Uno, ESP8266, LDR sensors, PIR sensors |
| **DevTools** | Nodemon, Vite dev server, npm workspaces |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (with npm 9+)
- **PostgreSQL** 12+ (local or cloud: Neon)
- **InfluxDB** 2.x (cloud recommended)
- **MQTT Broker** (optional: HiveMQ Cloud, Mosquitto)
- **Git**

### Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd mpc_dashboard

# Install all dependencies (root + workspaces)
npm install
```

### Environment Setup

```bash
# Copy and edit server env file
cp server/.env.example server/.env
# Edit: DATABASE_URL, INFLUX_*, MQTT_* values

# Copy and edit client env file
cp client/.env.example client/.env
# Default values usually work for local dev
```

### Initialize Database

```bash
cd server
node ../db/setup-db.js
```

This runs `schema.sql` + `seed.sql` to:
- Create all tables (users, homes, devices, alerts)
- Insert demo user (`demo@energy.com`)
- Insert test devices and demo home

### Start All Services

```bash
# Terminal 1: Backend Server
npm run dev:server

# Terminal 2: Frontend Client
npm run dev:client

# Terminal 3 (Optional): Arduino Bridge
npm run dev:bridge
```

### Access Dashboard

- **Client**: http://localhost:5173
- **Server API**: http://localhost:5000
- **Demo Mode**: Click "Try Demo" on login page (no credentials needed)

---

## 📁 Directory Structure

```
mpc_dashboard/
├── client/                          # React SPA (Vite)
│   ├── src/
│   │   ├── App.jsx                  # Root component
│   │   ├── main.jsx                 # Entry point
│   │   ├── index.css                # Global styles
│   │   ├── api/
│   │   │   └── axios.js             # API client configuration
│   │   ├── components/
│   │   │   ├── common/              # Reusable components
│   │   │   │   ├── DemoBanner.jsx
│   │   │   │   └── LoadingSkeleton.jsx
│   │   │   ├── dashboard/           # Dashboard widgets
│   │   │   │   ├── LivePowerMeter.jsx
│   │   │   │   ├── UsageLineChart.jsx
│   │   │   │   ├── UsageBarChart.jsx
│   │   │   │   ├── CostCards.jsx
│   │   │   │   ├── DeviceList.jsx
│   │   │   │   ├── DeviceTimeline.jsx
│   │   │   │   ├── MotionStatusGrid.jsx
│   │   │   │   ├── VoltageStatusBar.jsx
│   │   │   │   ├── NILMAlertFeed.jsx
│   │   │   │   ├── AlwaysOnCard.jsx
│   │   │   │   └── DemoProgressBar.jsx
│   │   │   └── layouts/             # Route layouts
│   │   │       ├── UserLayout.jsx
│   │   │       ├── AdminLayout.jsx
│   │   │       └── DemoLayout.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useSocket.js         # Socket.io integration
│   │   │   ├── useLiveData.js       # Real-time power data
│   │   │   ├── useCost.js           # Cost calculations
│   │   │   └── useHomeId.js         # Home context
│   │   ├── pages/                   # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── DemoDashboard.jsx
│   │   │   ├── DevicesPage.jsx
│   │   │   ├── UsagePage.jsx
│   │   │   ├── CostPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── admin/               # Admin pages
│   │   │       ├── AdminOverview.jsx
│   │   │       ├── AdminUsersPage.jsx
│   │   │       ├── AdminDevicesPage.jsx
│   │   │       ├── AdminAnalyticsPage.jsx
│   │   │       ├── AdminAlertsPage.jsx
│   │   │       └── AdminSettingsPage.jsx
│   │   ├── router/
│   │   │   └── index.jsx            # Route definitions
│   │   ├── store/                   # Zustand state management
│   │   │   ├── authStore.js         # Auth + user state
│   │   │   ├── demoStore.js         # Demo mode state
│   │   │   └── liveDataStore.js     # Real-time data cache
│   │   └── utils/
│   │       ├── formatters.js        # Number/date formatting
│   │       └── jwt.js               # JWT decoding
│   ├── vite.config.js               # Vite build config
│   ├── tailwind.config.js           # Tailwind CSS
│   ├── postcss.config.js            # PostCSS
│   ├── index.html                   # HTML template
│   └── package.json
│
├── server/                          # Express.js Backend
│   ├── index.js                     # Server entry point
│   ├── api/
│   │   ├── auth.js                  # Auth endpoints
│   │   ├── home.js                  # Home/device endpoints
│   │   └── admin.js                 # Admin endpoints
│   ├── db/
│   │   ├── postgres.js              # PostgreSQL connection
│   │   └── influx.js                # InfluxDB connection
│   ├── middleware/
│   │   └── auth.js                  # JWT verification
│   ├── mqtt/
│   │   ├── mqttClient.js            # MQTT connection
│   │   └── subscriber.js            # Topic subscriptions
│   ├── services/
│   │   ├── powerEstimator.js        # Power calculation service
│   │   ├── nilmService.js           # Load monitoring
│   │   ├── motionService.js         # Motion detection
│   │   └── ldrService.js            # Light level monitoring
│   ├── socket/
│   │   └── socketManager.js         # Socket.io handlers
│   ├── demo/
│   │   ├── DemoReplayService.js     # Demo data replay
│   │   └── data/
│   │       └── recorded_day.json    # Sample data
│   ├── utils/
│   │   └── flux.js                  # InfluxDB query builder
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Template env file
│   └── package.json
│
├── bridge/                          # Arduino Serial Bridge
│   ├── arduino-bridge.js            # Main entry point
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── firmware/                        # Device Firmware
│   ├── README.md                    # Setup instructions
│   ├── arduino/
│   │   └── ldr_relay/
│   │       └── ldr_relay.ino        # Arduino Uno sketch
│   └── esp8266/
│       └── motion_relay/
│           └── motion_relay.ino     # ESP8266 sketch
│
├── grayskull/                       # Python Motion Detection
│   ├── motion_detect.py             # Main detection script
│   └── requirements.txt             # Python dependencies
│
├── db/                              # Database Setup
│   ├── setup-db.js                  # Initialize script
│   ├── postgres/
│   │   ├── schema.sql               # Table definitions
│   │   ├── seed.sql                 # Test data
│   │   └── hashPasswords.js         # Password hashing utility
│   └── influx/
│       └── setup.sh                 # InfluxDB setup
│
├── package.json                     # Root npm config (workspaces)
└── README.md                        # This file
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone <repo-url>
cd mpc_dashboard
npm install
```

### 2. Configure Environment Variables

#### Server (`server/.env`)

```bash
# Server
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-super-secret-key-change-in-production
JWT_DEMO_EXPIRY=30m

# PostgreSQL (use Neon for cloud)
DATABASE_URL=postgresql://user:password@localhost:5432/energydb

# InfluxDB (optional, demo works without)
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your-influx-token
INFLUX_ORG=your-org
INFLUX_BUCKET_REAL=power
INFLUX_BUCKET_DEMO=power_demo

# MQTT (optional, falls back to demo-only)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=user
MQTT_PASSWORD=pass
```

#### Client (`client/.env`)

```bash
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Setup Databases

#### PostgreSQL

**Option A: Local (Linux/Mac)**
```bash
# Create database
createdb energydb

# Apply schema
psql energydb < db/postgres/schema.sql

# Seed test data
psql energydb < db/postgres/seed.sql
```

**Option B: Local (Windows with PowerShell)**
```bash
# After PostgreSQL installation, use server setup script:
cd server
node ../db/setup-db.js
```

**Option C: Cloud (Neon)**
1. Create free account: https://neon.tech
2. Create project → copy connection string
3. Update `DATABASE_URL` in `server/.env`
4. Run: `node db/setup-db.js`

#### InfluxDB (Optional)

```bash
# Cloud: https://www.influxdata.com/
# Create bucket: "power" (REAL) and "power_demo" (DEMO)
# Generate API token
# Update INFLUX_URL, INFLUX_TOKEN, INFLUX_ORG in server/.env
```

### 4. Hash Test Passwords (Optional)

All test users have password: **`energy123`**

To regenerate hashes:
```bash
npm run hash-passwords
```

---

## ▶️ Running the Application

### Development Mode (All Services)

**Terminal 1 - Backend Server:**
```bash
npm run dev:server
# Starts on http://localhost:5000
# Auto-reloads on code changes (nodemon)
```

**Terminal 2 - Frontend Client:**
```bash
npm run dev:client
# Starts on http://localhost:5173
# Hot module reloading (HMR)
```

**Terminal 3 - Arduino Bridge (Optional):**
```bash
npm run dev:bridge
# Listens to serial port, publishes to MQTT
# Only needed if connecting Arduino
```

### Production Build

```bash
# Build everything
npm run build:client
npm run build:server

# Start production
npm run start:server
```

### Test Credentials

**Demo Mode** (No login needed):
- Click "Try Demo" on login page
- Pre-populated demo home with 5 devices
- Live simulated data via Socket.io

**Regular Login** (if DB seeded):
- **Email**: `admin@energy.com` or `ravi@energy.com`
- **Password**: `energy123`
- **Role**: admin / user

---

## ✨ Features

### User Dashboard
- ⚡ **Live Power Meter** — Real-time consumption (watts/kW)
- 📊 **Usage Charts** — Hourly & daily consumption trends
- 💰 **Cost Tracking** — Daily/weekly/monthly cost analysis
- 🏠 **Device List** — Control smart devices, toggle relays
- 📅 **Device Timeline** — On/off history with timestamps
- 🚨 **NILM Alerts** — Detect unusual device activity
- 💡 **Always-On Detection** — Find appliances consuming power 24/7
- 🌡️ **Voltage Status** — Electrical health monitoring

### Admin Panel
- 👥 **User Management** — Create, edit, delete users by home
- 🏘️ **Home Management** — Manage multiple energy monitoring homes
- ⚙️ **Device Configuration** — Setup devices, relay channels, thresholds
- 📈 **System Analytics** — Cross-home consumption analytics
- 🔔 **Alert Management** — Configure alert rules & thresholds
- ⚡ **Settings** — System configuration, tariff rates

### Demo Mode
- 🎬 **Recorded Data Replay** — Simulated real-world consumption
- 📱 **No Database Needed** — Works standalone
- 🔌 **No Hardware Needed** — Perfect for testing/development
- ⏱️ **Real-time Simulation** — Data streamed via Socket.io
- 📊 **Full UI Testing** — All dashboard widgets functional

---

## 🗄️ Database Schema

### PostgreSQL Tables

#### `homes`
```sql
id (UUID)              -- Primary key
name (TEXT)            -- Home name
address (TEXT)         -- Address
tariff_rate (NUMERIC)  -- Energy tariff (₹/kWh)
motion_timeout_mins    -- Motion sensor timeout
nilm_threshold_watts   -- NILM alert threshold
ldr_enabled (BOOL)     -- Light sensor enabled
motion_enabled (BOOL)  -- Motion sensor enabled
created_at (TIMESTAMP)
```

#### `users`
```sql
id (UUID)              -- Primary key
name (TEXT)            -- User name
email (TEXT UNIQUE)    -- Email address
password_hash (TEXT)   -- Bcrypt hash
role (TEXT)            -- 'admin' | 'user' | 'demo'
home_id (UUID FK)      -- Reference to homes.id
deleted_at (TIMESTAMP) -- Soft delete
created_at (TIMESTAMP)
```

#### `devices`
```sql
id (UUID)              -- Primary key
home_id (UUID FK)      -- Reference to homes.id
name (TEXT)            -- Device name (e.g., "Ceiling Fan")
type (TEXT)            -- 'fan' | 'light' | 'cooler' | 'tv' | 'fridge' etc.
room (TEXT)            -- Room name
rated_watts (INT)      -- Rated power consumption
relay_channel (INT)    -- Relay channel on Arduino (1-8)
is_active (BOOL)       -- Currently on/off
always_on (BOOL)       -- Flag for 24/7 devices (fridge)
created_at (TIMESTAMP)
```

#### `alerts`
```sql
id (UUID)              -- Primary key
home_id (UUID FK)      -- Reference to homes.id
type (TEXT)            -- 'nilm' | 'motion' | 'voltage' | 'system'
message (TEXT)         -- Alert message
severity (TEXT)        -- 'info' | 'warning' | 'critical'
acknowledged (BOOL)    -- Alert read status
created_at (TIMESTAMP)
```

#### Demo Tables
```sql
demo_homes             -- Like homes, isolated demo data
demo_devices           -- Like devices, for demo home
```

### InfluxDB Buckets

**Real Home Data** (`power` bucket):
```
Measurement: power_consumption
  Tags: home_id, device_id, room
  Fields: watts, voltage, current
  Timestamp: ISO-8601

Measurement: device_state
  Tags: home_id, device_id
  Fields: is_active (boolean), relay_channel
```

**Demo Data** (`power_demo` bucket):
```
Same structure, isolated for demo replay
```

---

## 🔌 Hardware Integration

### Arduino Uno + LDR (Light Sensor)

**Wiring:**
```
LDR + 10k Resistor → Voltage Divider → A0 (analog input)
Relay Control → D7 (digital output)
PWM Dimmer (optional) → D5
```

**Upload Sketch:**
```bash
1. Open Arduino IDE
2. Load: firmware/arduino/ldr_relay/ldr_relay.ino
3. Select Board: Arduino Uno
4. Select Port: COM3 (or your port)
5. Upload
```

**Serial Output:**
```
LDR:450,RELAY:HIGH
LDR:750,RELAY:LOW
```

### ESP8266 + PIR Sensor (Motion Detection)

**Wiring:**
```
PIR Sensor → D2 (GPIO4)
Relay Control → D5 (GPIO14)
```

**Upload Sketch:**
```bash
1. Install ESP8266 board manager in Arduino IDE
2. Load: firmware/esp8266/motion_relay/motion_relay.ino
3. Update WiFi SSID/Password in code
4. Select Board: NodeMCU 1.0
5. Upload
```

**Publishes to MQTT:**
```
home/{homeId}/motion/status → "MOTION_DETECTED" / "NO_MOTION"
home/{homeId}/relay/control → Command response
```

### Arduino Serial Bridge

Connects Arduino (serial USB) to MQTT broker:

```bash
# Setup
npm run dev:bridge

# Converts serial data to MQTT topics:
# Serial: "LDR:500,RELAY:HIGH"
# MQTT: home/home-id/ldr/status → {level: 500, relay: "HIGH"}
```

---

## 📡 MQTT Topics

| Topic | Direction | Payload |
|-------|-----------|---------|
| `home/{homeId}/power/current` | ← | `{"watts": 2500, "voltage": 230}` |
| `home/{homeId}/motion/status` | ← | `"MOTION_DETECTED"` |
| `home/{homeId}/ldr/status` | ← | `{"level": 450}` |
| `device/{deviceId}/relay/state` | ↔ | `{"channel": 1, "state": "ON"}` |
| `home/{homeId}/alert` | ← | `{"type": "nilm", "severity": "warning"}` |

---

## 🔗 API Endpoints

### Authentication

```http
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
→ {token, user}

POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secure123"
}
→ {token, user}

POST /api/auth/demo
→ {token, user, demo_home_id}
```

### Home & Devices

```http
GET /api/home/devices
→ [{id, name, type, room, rated_watts, is_active}]

PUT /api/home/devices/{id}
{
  "name": "Ceiling Fan",
  "rated_watts": 75,
  "is_active": true
}
→ {id, name, ...}

POST /api/home/relay/toggle
{
  "device_id": "uuid",
  "state": "ON"
}
→ {success: true}
```

### Admin

```http
GET /api/admin/users
→ [{id, name, email, role, home_id}]

POST /api/admin/users
{
  "name": "Jane",
  "email": "jane@example.com",
  "role": "user",
  "home_id": "uuid"
}
→ {id, name, ...}

DELETE /api/admin/users/{id}
→ {success: true}

GET /api/admin/homes
→ [{id, name, address, tariff_rate}]

PUT /api/admin/homes/{id}
{
  "tariff_rate": 8.5,
  "nilm_threshold_watts": 500
}
→ {id, name, ...}
```

---

## 👨‍💻 Development Workflow

### Code Style

- **JavaScript**: ES6 modules, functional components
- **React**: Hooks + Zustand for state management
- **CSS**: Tailwind utility classes
- **Backend**: RESTful API, async/await

### Adding New Features

**Example: Add new dashboard widget**

1. Create component: `client/src/components/dashboard/NewWidget.jsx`
2. Import in dashboard layout
3. Connect to Zustand store for data
4. Use Socket.io hooks for real-time updates
5. Style with Tailwind

**Example: Add new API endpoint**

1. Create route handler in `server/api/home.js` or `server/api/admin.js`
2. Add JWT middleware: `import { requireAuth } from "../middleware/auth.js"`
3. Validate input with Joi
4. Query database (PostgreSQL for relational, InfluxDB for time-series)
5. Emit Socket.io event for real-time updates
6. Add frontend API call in `client/src/api/axios.js`

### Testing Demo Mode

```bash
# No setup needed, just click "Try Demo"
# Loads 5 pre-configured devices
# Replays recorded power data
# All features work (charts, alerts, device control)
```

---

## 🐛 Troubleshooting

### Demo Endpoint Returns 500 Error

**Problem**: `{"error": "Demo login failed"}`

**Cause**: Database tables not created

**Solution**:
```bash
cd server
node ../db/setup-db.js
# Restart server
npm run dev:server
```

### MQTT Broker Not Connected

**Problem**: `[MQTT] offline / demo-only`

**Cause**: MQTT broker URL misconfigured or unreachable

**Solution**:
- Check `MQTT_BROKER_URL` in `server/.env`
- If no MQTT, demo mode still works (in-memory data)
- HiveMQ Cloud: https://www.hivemq.com/

### PostgreSQL Connection Failed

**Problem**: `[PostgreSQL] Connection failed`

**Cause**: DATABASE_URL incorrect or database not running

**Solution**:
```bash
# Check connection string format
# PostgreSQL URI: postgresql://user:pass@host:5432/dbname
# For Neon: postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Port 5000 Already in Use

**Problem**: `Error: listen EADDRINUSE :::5000`

**Solution** (Windows):
```powershell
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force
```

**Solution** (Linux/Mac):
```bash
lsof -ti:5000 | xargs kill -9
```

### Vite HMR Not Working

**Problem**: Changes not reflecting in browser

**Solution**:
```bash
# Add to client/.env
VITE_HMR_HOST=localhost
VITE_HMR_PORT=5173
```

### Socket.io Connection Refused

**Problem**: Real-time updates not working

**Cause**: CORS misconfiguration

**Solution**:
```javascript
// In server/socket/socketManager.js, verify CORS settings
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});
```

### InfluxDB Query Errors

**Problem**: `Error writing to InfluxDB`

**Cause**: Token expired or bucket doesn't exist

**Solution**:
- Regenerate API token in InfluxDB Cloud
- Verify bucket names match config
- Check organization ID

---

## 📚 Additional Resources

- **React Documentation**: https://react.dev
- **Vite Guide**: https://vitejs.dev
- **Socket.io**: https://socket.io
- **InfluxDB**: https://docs.influxdata.com
- **PostgreSQL**: https://www.postgresql.org/docs
- **MQTT**: https://mqtt.org
- **Arduino**: https://www.arduino.cc/en/Guide
- **ESP8266**: https://arduino-esp8266.readthedocs.io

---

## 📄 License

This project is provided as-is for educational and personal use.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

---

## 📞 Support

For issues, questions, or suggestions:
- Check Troubleshooting section above
- Review GitHub issues
- Check server logs in terminal

---

**Last Updated**: May 3, 2026
**Status**: ✅ Fully Functional with Demo Mode
