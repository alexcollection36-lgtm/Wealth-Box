import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

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

  app.use(cors({
    origin: [
      "https://alexcollection36-lgtm.github.io",
      "https://wealth-box.com",
      "https://www.wealth-box.com",
      "http://wealth-box.com",
      "http://www.wealth-box.com",
      "https://ais-dev-fkiph533gzk4dlledcqsa6-617908309211.europe-west2.run.app",
      "https://ais-pre-fkiph533gzk4dlledcqsa6-617908309211.europe-west2.run.app",
      "http://localhost:3000"
    ],
    credentials: true
  }));
  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), origin: req.headers.origin });
  });

  // API Route: Create Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripe = getStripe();
      const { productId, title, price, image, email, userId } = req.body;

      if (!productId || !title || !price || !email || !userId) {
        return res.status(400).json({ error: "Missing required fields: productId, title, price, email, or userId." });
      }

      const unitAmount = Math.round(parseFloat(price.replace("$", "")) * 100);
      const baseUrl = process.env.APP_URL || (req.headers.origin as string) || "http://localhost:3000";

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
                images: [image],
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

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Stripe Webhook (Simulated)
  // In production, you'd use stripe.webhooks.constructEvent with your endpoint secret
  app.post("/api/webhook", async (req, res) => {
    try {
      const event = req.body;

      // Handle the checkout.session.completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        // Prioritize email from metadata (account email) over Stripe's customer_details
        const customerEmail = session.metadata?.customerEmail || session.customer_details?.email;
        const customerName = session.customer_details?.name || "Valued Customer";
        const productId = session.metadata?.productId;
        const productTitle = session.metadata?.productTitle;

        console.log(`--- PAYMENT SUCCESSFUL ---`);
        console.log(`Product: ${productTitle} (${productId})`);
        console.log(`Customer: ${customerName} (${customerEmail})`);

        if (productId && customerEmail) {
          let productData: any = null;

          // 1. Try to fetch product configuration from Firestore
          try {
            const productDoc = await db.collection("products").doc(productId).get();
            if (productDoc.exists) {
              productData = productDoc.data();
              console.log(`Product data fetched from Firestore for ID: ${productId}`);
            }
          } catch (error: any) {
            console.warn(`Firestore fetch failed for ID: ${productId}: ${error.message}. Falling back to hardcoded data.`);
          }

          // 2. Fallback to hardcoded data if Firestore fetch failed or product not found
          if (!productData && HARDCODED_PRODUCTS[productId]) {
            productData = HARDCODED_PRODUCTS[productId];
            console.log(`Using hardcoded fallback for product ID: ${productId}`);
          }

          if (productData) {
            const downloadUrl = productData.downloadUrl || "Link not configured yet. Please contact support.";
            const downloadUrl2 = productData.downloadUrl2 || "";
            const emailSubject = productData.emailSubject || `Your download: ${productTitle}`;
            let emailBody = productData.emailBody || `Thanks for your purchase! Here is your link: {{DOWNLOAD_URL}}`;

            // 3. Replace placeholders
            emailBody = emailBody.replace("{{DOWNLOAD_URL}}", downloadUrl);
            emailBody = emailBody.replace("{{DOWNLOAD_URL_2}}", downloadUrl2);

            // 4. Send Email
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || "gmail",
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              });

              await transporter.sendMail({
                from: `"Digital Product Store" <${process.env.EMAIL_USER}>`,
                to: customerEmail,
                subject: emailSubject,
                text: emailBody,
                html: emailBody.replace(/\n/g, "<br>"), // Basic text to HTML conversion
              });

              console.log(`Email sent successfully to ${customerEmail}`);
            } else {
              console.warn("Email credentials not configured. Skipping email sending.");
              console.log("Simulated Email Content:");
              console.log(`Subject: ${emailSubject}`);
              console.log(`Body: ${emailBody}`);
            }
          } else {
            console.error(`Product configuration not found for ID: ${productId} (Firestore and Hardcoded)`);
          }
        }
        console.log(`---------------------------`);
        
        return res.json({ 
          received: true, 
          action: productId && customerEmail ? "Processing delivery" : "Missing metadata",
          productId,
          customerEmail
        });
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
