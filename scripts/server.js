const express = require('express');
const multer = require('multer'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure multer to parse the FormData and files
const upload = multer({ storage: multer.memoryStorage() });

// Your Google reCAPTCHA Secret Key (from your .env file)
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

app.post('/api/register', upload.fields([{ name: 'payment' }]), async (req, res) => {
    
    // Extract data and the token
    const { fullName, phone, instituteId, size, transactionId, captchaToken } = req.body;
    const files = req.files; 

    if (!captchaToken) {
        return res.status(400).json({ error: 'Security token is missing' });
    }

    try {
        // 1. Verify the token with Google
        const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
        
        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
        });
        
        const googleData = await response.json();

        // 2. Evaluate the Google reCAPTCHA v3 response (0.0 is bot, 1.0 is human)
        if (!googleData.success || googleData.score < 0.5) {
            console.warn('Bot detected! Score:', googleData.score);
            return res.status(403).json({ error: 'Security check failed.' });
        }

        // 3. Security passed! Process the user data and save the file
        // console.log("User:", fullName, "Transaction:", transactionId);

        res.status(200).json({ message: 'Registration Successful!' });

    } catch (error) {
        console.error("reCAPTCHA validation error:", error);
        res.status(500).json({ error: 'Internal server error validating security token' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});