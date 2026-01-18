DATABASE MODELS (PostgreSQL – Neon)
1.1 Users Table

Handles Admin, Stylist, Customer

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'stylist', 'customer')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

1.2 Services Table

Salon services with pricing

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

1.3 Stylists Table

Extends users with stylist-specific data

CREATE TABLE stylists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_level VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

1.4 Stylist Availability Table

Controls how many stylists are available per hour

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  stylist_count INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (date, time_slot)
);

1.5 Bookings Table

Core booking entity

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  stylist_id UUID REFERENCES stylists(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status VARCHAR(30) CHECK (
    status IN ('booked', 'in_progress', 'completed', 'cancelled')
  ) DEFAULT 'booked',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

1.6 Payments Table

Stripe deposit tracking

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

1.7 Chatbot Knowledge Base

Used for RAG-based AI chatbot

CREATE TABLE chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

2️⃣ API SCHEMAS (REST – EXPRESS)
2.1 AUTH APIs
POST /api/auth/register

Register customer or stylist

{
  "fullName": "Jane Doe",
  "email": "jane@email.com",
  "phone": "5551234567",
  "password": "securepassword",
  "role": "customer"
}

POST /api/auth/login
{
  "email": "admin@salon.com",
  "password": "password"
}


Response

{
  "token": "JWT_TOKEN",
  "role": "admin"
}

2.2 SERVICES APIs
GET /api/services

Public endpoint

[
  {
    "id": "uuid",
    "name": "Braids",
    "price": 150,
    "duration_minutes": 60
  }
]

POST /api/admin/services

(Admin only)

{
  "name": "Weaves",
  "price": 200
}

2.3 AVAILABILITY APIs
GET /api/availability?date=2026-02-01
[
  {
    "time": "10:00",
    "availableSlots": 2
  }
]

POST /api/admin/availability

(Admin only)

{
  "date": "2026-02-01",
  "time": "11:00",
  "stylist_count": 3
}

2.4 BOOKINGS APIs
POST /api/bookings

(Create booking after Stripe success)

{
  "serviceId": "uuid",
  "bookingDate": "2026-02-01",
  "bookingTime": "11:00"
}

GET /api/admin/bookings
[
  {
    "id": "uuid",
    "customer": "Jane Doe",
    "service": "Braids",
    "time": "11:00",
    "status": "booked"
  }
]

PATCH /api/admin/bookings/:id/assign-stylist
{
  "stylistId": "uuid"
}

PATCH /api/bookings/:id/status

(Admin or Stylist)

{
  "status": "in_progress"
}

2.5 PAYMENTS (STRIPE)
POST /api/payments/create-intent
{
  "bookingId": "uuid",
  "amount": 50
}

POST /api/webhooks/stripe

Handles:

payment_intent.succeeded

payment_intent.failed

(No client response)

2.6 NOTIFICATIONS
POST /api/notifications/send

(Internal use)

{
  "bookingId": "uuid",
  "type": "sms"
}

2.7 AI CHATBOT
POST /api/chatbot/chat
{
  "message": "How much is braids?"
}


Response

{
  "reply": "Braids start from $150. A $50 deposit is required to book."
}

3️⃣ CRITICAL BUSINESS LOGIC RULES (VERY IMPORTANT)

Trae must enforce these rules:

❌ No booking without Stripe payment success

⏰ Time slots = 1 hour only

📅 Business hours: 10am–4pm (Mon–Sat)

👩‍🎨 Availability = stylist_count − existing bookings

💵 $50 deposit is mandatory and non-refundable

🔐 Role-based access enforced on all admin routes

📆 Google Calendar color mapping:

Booked → Yellow

In Progress → Green

Completed → Blue

Cancelled → Red