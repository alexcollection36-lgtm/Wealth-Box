import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import fs from "fs";

dotenv.config();

// Load Firebase Config safely
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Firebase Admin initialization failed:", error);
}

const db = getFirestore(admin.app());

const HARDCODED_PRODUCTS: Record<string, any> = {
  "bundle": {
    id: "bundle",
    title: "The Ultimate Wealth Bundle",
    downloadUrl: "https://example.com/download1",
    downloadUrl2: "https://example.com/download2",
    emailSubject: "Your Download: The Ultimate Wealth Bundle",
    emailBody: "Hi there!\n\nThank you for your purchase.\n\nLink 1: {{DOWNLOAD_URL}}\nLink 2: {{DOWNLOAD_URL_2}}\n\nBest regards,\nThe WealthBox Team"
  }
};

let stripeClient: Stripe | null = null;

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  const isValidPrefix = key && (key.startsWith('sk_') || key.startsWith('rk_') || key.startsWith('mk_'));
  
  if (!key || key === 'Alex' || !isValidPrefix) {
    throw new Error('Invalid or missing STRIPE_SECRET_KEY. Please set a valid Stripe Secret Key (starting with sk_, rk_, or mk_) in the application settings.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Global Middleware
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  }));
  
  // Use raw body for webhook, json for others
  app.use((req, res, next) => {
    if (req.originalUrl === "/api/webhook") {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // Request Logger
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    if (req.path.startsWith('/api/')) {
      console.log(`[${timestamp}] ${req.method} ${req.url}`);
    }
    next();
  });

  // 2. API Routes
  const apiRouter = express.Router();

  // Root Health Check (outside /api)
  app.get("/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
  });

  // Health Check
  apiRouter.get(["/health", "/health/"], (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyValid: process.env.STRIPE_SECRET_KEY && (process.env.STRIPE_SECRET_KEY.startsWith('sk_') || process.env.STRIPE_SECRET_KEY.startsWith('rk_'))
    });
  });

  // Create Checkout Session
  apiRouter.get(["/create-checkout-session", "/create-checkout-session/"], (req, res) => {
    res.status(405).json({ error: "Method Not Allowed. Please use POST." });
  });

  apiRouter.post(["/create-checkout-session", "/create-checkout-session/"], async (req, res) => {
    console.log(`[${new Date().toISOString()}] POST /api/create-checkout-session - START`);
    try {
      const stripe = getStripe();
      const { productId, title, price, image, email, userId } = req.body;

      console.log(`- Params: product=${productId}, email=${email}, userId=${userId}, price=${price}`);

      if (!productId || !title || !price || !email || !userId) {
        return res.status(400).json({ error: "Missing required fields: productId, title, price, email, or userId." });
      }

      // Robust price parsing
      let numericPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
      if (isNaN(numericPrice)) {
        return res.status(400).json({ error: `Invalid price format: ${price}` });
      }
      const unitAmount = Math.round(numericPrice * 100);

      const baseUrl = process.env.APP_URL || (req.headers.origin as string) || "https://wealth-box.com";
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_creation: "always",
        billing_address_collection: "auto",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: title,
                images: image ? [image] : [],
                description: `Digital download for ${title}. Will be sent to your email after purchase.`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?canceled=true`,
        metadata: {
          productId,
          productTitle: title,
          customerEmail: email,
          userId: userId,
        },
      });

      console.log(`- Session created: ${session.id}`);
      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Session Error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session." });
    }
  });

  // Stripe Webhook
  apiRouter.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (webhookSecret && sig) {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Fallback for testing without secret
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log(`--- PAYMENT SUCCESSFUL: ${session.id} ---`);
      
      const { productId, productTitle, customerEmail, userId } = session.metadata;
      const actualEmail = customerEmail || session.customer_details?.email || session.customer_email;

      if (productId && actualEmail) {
        try {
          let productData: any = null;

          // 1. Try Firestore
          try {
            const productDoc = await db.collection("products").doc(productId).get();
            if (productDoc.exists) {
              productData = productDoc.data();
            }
          } catch (e) {}

          // 2. Fallback Hardcoded
          if (!productData && HARDCODED_PRODUCTS[productId]) {
            productData = HARDCODED_PRODUCTS[productId];
          }

          if (productData) {
            const downloadUrl = productData.downloadUrl || "https://wealth-box.com/download";
            const emailSubject = productData.emailSubject || `Your purchase: ${productTitle || 'WealthBox Product'}`;
            let emailBody = productData.emailBody || `Thanks for your purchase! Download here: {{DOWNLOAD_URL}}`;
            
            emailBody = emailBody.replace("{{DOWNLOAD_URL}}", downloadUrl);

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
              });

              await transporter.sendMail({
                from: `"WealthBox" <${process.env.EMAIL_USER}>`,
                to: actualEmail,
                subject: emailSubject,
                text: emailBody,
                html: emailBody.replace(/\n/g, "<br>"),
              });
              console.log(`Email sent to ${actualEmail}`);
            } else {
              console.log("Email not configured. Content:", emailBody);
            }
          }
        } catch (e) {
          console.error("Error processing fulfillment:", e);
        }
      }
    }

    res.json({ received: true });
  });

  // API 404 Handler
  apiRouter.all("*", (req, res) => {
    console.warn(`[API 404] ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // 3. Static Files & SPA Fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Serve index.html for any non-API route
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
    console.log(`- Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`- Stripe Secret Key: ${process.env.STRIPE_SECRET_KEY ? "Set" : "NOT SET"}`);
    console.log(`- App URL: ${process.env.APP_URL || "NOT SET (will use request origin)"}`);
  }).on('error', (err: any) => {
    console.error(`[${new Date().toISOString()}] Server failed to start:`, err);
  });
}

startServer().catch(err => {
  console.error(`[${new Date().toISOString()}] Fatal error starting server:`, err);
});
