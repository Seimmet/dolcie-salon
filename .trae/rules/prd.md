Product Name

Victoria Braids & Weaves – Booking & Salon Management System

Product Type

Single-salon appointment booking, operations, and customer engagement platform.

Version

v1.0 (MVP → Production-ready)

1. PRODUCT OVERVIEW
1.1 Problem Statement

The salon currently relies on third-party booking tools that:

Limit customization and branding

Do not fully reflect salon workflows

Charge recurring fees

Lack deep control over stylist assignment, availability, and service tracking

1.2 Solution

Build a fully branded, custom booking and salon operations system that:

Enables customers to book appointments online

Requires a fixed $50 Stripe deposit

Dynamically manages stylist availability

Provides role-based dashboards

Sends automated SMS & email notifications

Visualizes bookings in a calendar

Includes an AI-powered chatbot that speaks on behalf of the salon owner

2. TARGET USERS & ROLES
2.1 User Roles
Role	Description
Admin	Salon owner / manager
Stylist	Salon staff performing services
Customer	Clients booking appointments
2.2 Role-Based Access
Role	Access
Admin	Full system access
Stylist	Assigned bookings only
Customer	Own bookings only
3. TECH STACK
Frontend

React

Vite

Responsive, mobile-first

Existing salon branding (colors, fonts, UI)

Backend

Node.js

Express.js

Database

Neon (PostgreSQL)

Integrations

Stripe (payments)

Twilio (SMS)

Email service (Resend / Nodemailer)

Google Calendar API

Cloudinary (media)

OpenAI (AI chatbot)

4. CORE FEATURES & REQUIREMENTS
4.1 CUSTOMER BOOKING FLOW
Entry Point

“Book Appointment” button on landing page

Step 1: Service Selection

Dropdown list of salon services

Each service includes:

Name

Price

Fixed service duration: 1 hour

⚠️ Important Notice (Displayed on ALL steps):

“A $50 non-refundable deposit is required for all appointments.”

Step 2: Customer Information

Required fields:

Full Name

Address

Phone Number

Email Address

Validation:

Required fields must be completed

Phone number format validation

Step 3: Calendar & Time Selection

Business Rules:

Working days: Monday – Saturday

Working hours: 10:00 AM – 4:00 PM

Time slots: 1-hour intervals

Booking capacity per slot depends on:

Number of stylists available

Existing confirmed bookings

System Behavior:

Disable unavailable slots

Prevent overbooking

Availability is dynamically fetched from backend

Step 4: Payment (Stripe)

Stripe Checkout

Charge: $50 deposit

Deposit is NOT deducted from service price

Booking only confirmed after successful payment

Post-Payment Actions

Save booking to database

Send SMS confirmation (Twilio)

Send email confirmation

Create Google Calendar event

Default booking status: Booked

5. ADMIN DASHBOARD
5.1 Authentication

Secure login

JWT-based role authentication

5.2 Service Management

Admin can:

Add services

Edit service name

Set service price

5.3 Stylist Management

Admin can:

Add stylist

Assign skill level

Set availability & attendance

Control number of stylists available per hour

5.4 Booking Management

Admin can:

View all bookings

Filter by date, stylist, status

Assign stylist to booking

Reassign stylist if needed

5.5 Booking Status Management

Statuses:

Status	Color
Booked	Yellow
In Progress	Green
Completed	Blue
Cancelled	Red
5.6 Calendar View

Google Calendar style UI

Color-coded events

Each event displays:

Customer name

Service

Time

Assigned stylist

Status

6. STYLIST DASHBOARD

Stylist can:

Login securely

View assigned bookings

See customer details

See service time & type

Update booking status:

In Progress

Completed

Restrictions:

Cannot see other stylists’ bookings

Cannot edit pricing or services

7. CUSTOMER DASHBOARD

Customer can:

Login

View upcoming appointments

See booking status

Receive SMS & email updates

Chat with salon AI assistant

8. AI-POWERED CHATBOT
Purpose

Answer customer questions

Guide booking flow

Act as a digital salon assistant

Knowledge Base Includes:

Services & pricing

Opening hours

Booking rules

Deposit policy

Cancellation policy

Capabilities

Natural language conversation

Embedded chat widget

RAG-based responses

Owner-like tone

9. DATABASE MODELS (HIGH LEVEL)
Users

id

name

email

phone

role

Services

id

name

price

Stylists

id

user_id

skill_level

availability

Bookings

id

customer_id

service_id

stylist_id

date

time

status

Payments

id

booking_id

stripe_payment_id

amount

Availability

date

time

stylist_count

10. SYSTEM RULES & CONSTRAINTS

No booking without Stripe payment

Time slots lock automatically when capacity is reached

Admin controls stylist capacity

Deposit warning shown on all booking steps

Secure role-based API routes

Stripe webhooks confirm payments

Data integrity enforced at DB level

11. NON-FUNCTIONAL REQUIREMENTS

Mobile-first

Fast load times

Secure authentication

Scalable architecture

Clean code structure

Maintainable & extendable

12. FUTURE ENHANCEMENTS (Post-MVP)

Full service payment after appointment

Loyalty program

Multi-location support

Analytics & reports

WhatsApp notifications

Staff payroll tracking

13. SUCCESS METRICS

Booking completion rate

Reduced no-shows

Admin time saved

Customer satisfaction

System uptime