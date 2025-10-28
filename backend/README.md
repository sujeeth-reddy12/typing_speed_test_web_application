
# Locator Web App (updated)

## Setup (local)
1. Ensure MongoDB is running locally.
2. From the backend folder install dependencies:
   ```bash
   cd backend
   npm install
   ```
   (bcrypt and jsonwebtoken have been added to package.json)
3. Start server:
   ```bash
   npm start
   ```
4. Open http://localhost:5000 in your browser.

Default MongoDB URI used: `mongodb://127.0.0.1:27017/locatorDB`
Set `MONGO_URI` in backend/.env to override. Set `JWT_SECRET` in .env to change token secret.
