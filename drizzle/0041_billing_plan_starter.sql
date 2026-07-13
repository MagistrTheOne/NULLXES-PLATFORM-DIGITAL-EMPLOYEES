-- Add starter self-serve billing plan.
ALTER TYPE "organization_billing_plan" ADD VALUE IF NOT EXISTS 'starter';
