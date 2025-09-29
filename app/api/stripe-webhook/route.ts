import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { 
  getUserSubscription, 
  createUserSubscription, 
  updateUserSubscription,
  getUserSubscriptionByStripeCustomerId,
  ensureDatabaseInitialized 
} from '@/lib/database';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find user by Stripe customer ID
    const existingSubscription = await getUserSubscriptionByStripeCustomerId(customerId);
    if (existingSubscription) {
      // Update existing subscription
      await updateUserSubscription(existingSubscription.user_id, {
        stripe_subscription_id: subscription.id,
        status: subscription.status as 'active' | 'cancelled' | 'past_due',
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        plan_type: 'premium'
      });
    } else {
      // This shouldn't happen in normal flow, but handle it gracefully
      console.warn('Subscription created for unknown customer:', customerId);
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const existingSubscription = await getUserSubscriptionByStripeCustomerId(customerId);
    
    if (existingSubscription) {
      await updateUserSubscription(existingSubscription.user_id, {
        status: subscription.status as 'active' | 'cancelled' | 'past_due',
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      });
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const existingSubscription = await getUserSubscriptionByStripeCustomerId(customerId);
    
    if (existingSubscription) {
      await updateUserSubscription(existingSubscription.user_id, {
        status: 'cancelled',
        plan_type: 'free'
      });
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const existingSubscription = await getUserSubscriptionByStripeCustomerId(customerId);
    
    if (existingSubscription) {
      await updateUserSubscription(existingSubscription.user_id, {
        status: 'active'
      });
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const existingSubscription = await getUserSubscriptionByStripeCustomerId(customerId);
    
    if (existingSubscription) {
      await updateUserSubscription(existingSubscription.user_id, {
        status: 'past_due'
      });
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

