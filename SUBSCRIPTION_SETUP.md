# Subscription System Setup Guide

This guide explains how to set up the subscription system for the WordPress Article Editor.

## 🚀 Quick Setup

### 1. Stripe Configuration

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Create a product and price for the premium subscription ($20/month)

#### Create Stripe Product and Price

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Set product name: "Premium Subscription"
4. Set price: $20.00 USD
5. Set billing period: Monthly
6. Copy the Price ID (starts with `price_`)

### 2. Environment Variables

Add these variables to your `.env.local` file:

```env
# JWT Secret for authentication
JWT_SECRET=your_secure_jwt_secret_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here

# Base URL for your application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/stripe-webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret

### 4. Database Migration

The subscription system will automatically create the required tables when the application starts. No manual migration is needed.

## 📊 How It Works

### Free Plan
- 25 image crops per month
- Usage resets on the 1st of each month
- No payment required

### Premium Plan
- Unlimited image crops
- $20/month subscription
- Managed through Stripe Customer Portal

### Usage Tracking
- Each "Apply Crop" action counts as one usage
- Usage is tracked per user per day
- Monthly totals are calculated for limits

## 🔧 API Endpoints

### Usage API
- `GET /api/usage` - Get current usage information
- `POST /api/usage` - Increment usage (called when cropping)

### Subscription API
- `GET /api/subscription` - Get subscription details
- `POST /api/subscription` - Create subscription
- `PUT /api/subscription` - Update subscription

### Stripe Integration
- `POST /api/create-checkout-session` - Create Stripe checkout
- `POST /api/create-portal-session` - Create customer portal
- `POST /api/stripe-webhook` - Handle Stripe webhooks

## 🎨 UI Components

### UsageDisplay
Shows current usage with progress bar and upgrade button.

### SubscriptionManager
Displays subscription status and management options.

## 🧪 Testing

### Test the Free Plan
1. Create a new account
2. Try cropping images (up to 25 times)
3. Verify usage counter updates
4. Test limit enforcement

### Test the Premium Plan
1. Use test card: `4242 4242 4242 4242`
2. Complete checkout flow
3. Verify unlimited usage
4. Test subscription management

## 🚨 Important Notes

1. **Webhook Security**: Always verify webhook signatures in production
2. **Rate Limiting**: Consider adding rate limiting to usage API
3. **Error Handling**: Monitor failed payments and subscription issues
4. **Backup**: Regular database backups for subscription data

## 🔍 Troubleshooting

### Common Issues

1. **Usage not tracking**: Check JWT authentication
2. **Stripe errors**: Verify API keys and webhook configuration
3. **Database errors**: Ensure Postgres is properly configured
4. **UI not updating**: Check API responses and error handling

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages in the console.

## 📈 Monitoring

Monitor these metrics:
- Usage patterns per user
- Subscription conversion rates
- Failed payment rates
- API response times

## 🔒 Security Considerations

1. Always use HTTPS in production
2. Validate all webhook signatures
3. Sanitize user inputs
4. Implement proper error handling
5. Monitor for suspicious activity

