# Smart Parking System 🚗 

A modern, full-stack Smart Parking System built with HTML/CSS/JS (Frontend) and Node.js/Express + MySQL (Backend).

## Project Structure
- **Frontend Files:** All `.html`, `.css` (inside `/css`), and `.js` (inside `/js`) files in the root folder.
- **Backend API:** The `backend/` folder contains the Node.js server and database schema.

---

## How to Run the Project (Step-by-Step)

Because this is a Full-Stack application, you need to start the backend server before opening the frontend. If you don't start the server, the website will show loading spinners forever.

### Step 1: Ensure MySQL is Running
1. Since you use **MySQL Workbench**, your MySQL database service usually runs automatically in the background on Windows. 
2. You can open **MySQL Workbench**, click on your local connection (Local instance MySQL80), and enter your password (`Nave@2004`) to visually see your `smart_parking` database and tables!
3. *(Note: The database `smart_parking` and all tables have already been created for you, so you don't need to run any SQL commands).*

### Step 2: Start the Node.js Backend Server
You must run the Node.js server to handle data requests.

**Using VS Code Terminal:**
1. Open this project folder in VS Code.
2. Open a new terminal (`Terminal` -> `New Terminal`).
3. Change directory into the backend folder by typing:
   ```bash
   cd backend
   ```
4. Start the server by typing:
   ```bash
   npm start
   ```
   *You should see a message saying "✅ Smart Parking Server connected to MySQL on port 3000". Leave this terminal open!*

### Step 3: Open the Frontend
Now that the backend is running, you can use the website!

**Method 1: Live Server (Recommended)**
1. In VS Code, install the extension called **"Live Server"** by Ritwick Dey.
2. Right-click on `index.html` and select **"Open with Live Server"**.
3. It will open your browser at `http://127.0.0.1:5500/index.html` and automatically refresh when you make changes.

**Method 2: Direct File Open**
1. Simply go to your file explorer (`Desktop\coding\java\new`).
2. Double-click `index.html` to open it in Chrome, Edge, or Firefox.

---

## Troubleshooting

- **"Failed to load slots from server" Error:**
  - This means your Node.js server isn't running. Go back to Step 2 and make sure you ran `npm start` in the backend folder.
- **Database Connection Error in Terminal:**
  - This means your MySQL database is not turned on. Open XAMPP or your MySQL service and start it.

## Default Pages Guide
- `index.html` - Homepage
- `dashboard.html` - Live Parking Map
- `my-vehicles.html` - Manage your cars/bikes
- `admin-dashboard.html` - Admin control panel for fees and slots
- `admin-verify.html` - Security portal to verify arriving vehicles against bookings
