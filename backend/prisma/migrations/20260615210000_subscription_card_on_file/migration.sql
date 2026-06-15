-- Masked card-on-file snapshot for the Settings → Payments screen. Paystack
-- delivers these on the first charge.success in `data.authorization`. None of
-- these are sensitive on their own — they're the same fields Stripe / Paystack
-- safely echo back to merchants. We never store the full PAN or CVV.
ALTER TABLE "user_subscriptions"
  ADD COLUMN "card_last4" TEXT,
  ADD COLUMN "card_brand" TEXT,
  ADD COLUMN "card_bank" TEXT,
  ADD COLUMN "card_exp_month" TEXT,
  ADD COLUMN "card_exp_year" TEXT,
  ADD COLUMN "card_authorization_code" TEXT;
