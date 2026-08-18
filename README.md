# Jankalyan Medical Store - 24x7 Certified Community Pharmacy & AI Assistant
Sangola, Maharashtra

A certified healthcare web application featuring an interactive AI Pharmacist Assistant, WhatsApp prescription ordering, clinical BMI calculator, and medicine catalog.

## Netlify Deployment Guide

This project is pre-configured for instant **Netlify** deployment with built-in serverless functions and resilient client-side fallbacks.

### 1. Deploying to Netlify
1. Connect your repository to Netlify (or drag and drop the project folder).
2. Netlify will automatically detect `netlify.toml` and configure:
   - **Publish directory:** `.` (root)
   - **Functions directory:** `netlify/functions`
   - **Redirects:** `/api/chat` -> `/.netlify/functions/chat`

### 2. Environment Variables (Optional for Gemini 3.7 Flash)
In your Netlify site dashboard:
1. Go to **Site Configuration** > **Environment variables**.
2. Add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API Key)*
3. Redeploy the site.

*Note: Even without an API key or if deployed purely on a static CDN, the built-in pharmacy intelligence engine will automatically answer customer queries regarding 24x7 timings, store location (Near Wadhegaon Naka, Sangola), proprietor (Mr. Siddhu Hazare), WhatsApp orders (+91 86691 18742), and medicines in English, Marathi, and Hindi.*
