@AGENTS.md
# AGENTS.md

## Project

NULLXES Digital Employees

Enterprise platform for creating, managing, deploying and monitoring Digital Employees.

This is NOT a CRM.
This is NOT a generic SaaS dashboard.
This is NOT an analytics platform.

The product is an operating system for digital employees.

Users should feel like they are managing a workforce of intelligent digital humans.

---

## Tech Stack

Framework:

* Next.js 16 App Router
* TypeScript
* React 19

Database:

* Neon PostgreSQL
* Drizzle ORM

Authentication:

* Better Auth

UI:

* shadcn/ui only
* Tailwind CSS v4

Restrictions:

* No custom UI library
* No Material UI
* No Ant Design
* No Chakra
* No Radix components outside shadcn wrappers

---

## Design Philosophy

Inspired by:

* Apple
* Linear
* OpenAI
* Notion
* Stripe Dashboard

Avoid:

* Dribbble concepts
* Startup dashboard clichés
* Bright gradients
* Neon cyberpunk
* Crypto aesthetics
* Gaming interfaces

The interface should feel:

* premium
* sharp
* confident
* operational
* minimal
* black & white

REBURN: digital workforce operating system — not a soft Fortune-500 SaaS brochure.

---

## Voice Rules (REBURN)

Dual voice:

* **Product** (landing, pricing, dashboard copy, empty states): direct, sharp. “Digital employees. Not another chat wrapper.” / RU: “Цифровые сотрудники. Не очередная обёртка над чатом.”
* **Checkout / legal / ToS**: neutral-clear
* **Enterprise / Holding / sales / integrations / partner API**: polite for $$$ — calm enterprise tone

Do not use “quiet Fortune-500 only” as the single product voice.

---

## Visual Language

Theme:

* Black and White only

Primary Colors:

* #000000
* #0A0A0A
* #111111
* #FFFFFF

No:

* Blue
* Purple
* Pink
* Green
* Orange
* Rainbow gradients

Accent:

* White
* Glass highlights
* Soft shadows

---

## Surface Style

Cards:

* Medium radius
* Subtle borders
* Layered depth
* Less soft glass — clearer hierarchy

Examples:

background:
rgba(255,255,255,0.02)

border:
rgba(255,255,255,0.08)

hover:
rgba(255,255,255,0.04)

No heavy blur abuse.

No fake futuristic effects.

Landing / pricing: denser type, explicit price and employee capacity.

---

## Product Layout

16:9 Desktop First

Structure:

Sidebar
Top Navigation
Main Workspace
Context Panel

---

## Sidebar

Width: 280px

Sections:

NULLXES Logo

Navigation:

* New Digital Employee
* Digital Employees
* Analytics
* Settings

Bottom:

User Profile

Avatar
MagistrTheOne

Role:
Administrator

---

## Main Workspace

Title:

Digital Employees

Subtitle:

Manage and operate your digital workforce.

Primary action:

New Digital Employee

---

## Core Experience

The main focus of the platform is Digital Employees.

Analytics is secondary.

Graphs are secondary.

Employees are primary.

Users should immediately see their workforce.

---

## Digital Employee Card

Each card contains:

Avatar

Name

Role

Department

Status

Success Rate

Recent Activity

Examples:

Somnia
Enterprise Sales Employee

Kaira
Customer Support Employee

Megan
Legal Operations Employee

Lili
Data Analyst

Atlas
Automation Engineer

---

## Employee Status

Available

Busy

In Meeting

Processing

Offline

Status indicators should be subtle.

No bright colors.

Use typography and opacity instead.

---

## Right Context Panel

Workforce Summary

Digital Employees

Tasks Completed

Hours Saved

Success Rate

Recent Activity

This panel is informational only.

It should never overpower employee cards.

---

## UX Principles

Every screen should answer:

Who are my Digital Employees?

What are they doing right now?

How are they performing?

Can I create another one?

Nothing else is more important.

---

## Branding

Product Name:

NULLXES Digital Employees

Positioning:

Digital Workforce Operating System

Tagline:

Digital employees. Not another chat wrapper.

RU: Цифровые сотрудники. Не очередная обёртка над чатом.

The product should feel like the control center of a digital workforce.




# Anti-Neural-Slop Rules

Do not build future architecture today.

Do not create tables for hypothetical features.

Do not create:

analytics

notifications

billing

subscriptions

knowledge

memory

chat

conversations

audit logs

API keys

unless explicitly requested in the current iteration.

One iteration = one domain.

Complete the current domain before creating the next one.

Never create more than:

* one business entity
* one migration
* one verification path

per iteration.

Prefer:

small migrations

small commits

small files

Stop immediately after success criteria are met.

Do not continue "because it might be useful later".

Future requirements are not current requirements.
