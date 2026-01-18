/**
 * Transactional Email Service
 * 
 * Handles Shopify-triggered transactional emails:
 * - Order confirmation
 * - Shipping notification
 * - Abandoned cart
 * - Customer welcome
 */

import { emailService } from './email.service';
import { logger } from '../utils/logger';

export interface TransactionalEmailData {
    type: 'order_confirmation' | 'order_shipped' | 'abandoned_cart' | 'shopify_welcome';
    to: string;
    checkoutId?: string;
    data: {
        orderId?: string;
        orderNumber?: string;
        customerName?: string;
        firstName?: string;
        lastName?: string;
        totalPrice?: string;
        currency?: string;
        lineItems?: Array<{
            title: string;
            quantity: number;
            price: string;
            imageUrl?: string;
        }>;
        trackingNumber?: string;
        trackingUrl?: string;
        carrier?: string;
        checkoutUrl?: string;
        subtotal?: string;
        customerId?: string;
    };
}

const STORE_NAME = process.env.STORE_NAME || 'Our Store';
const STORE_URL = process.env.SHOPIFY_STORE_URL ? `https://${process.env.SHOPIFY_STORE_URL}` : '#';

/**
 * Email templates for transactional emails
 */
const templates = {
    order_confirmation: (data: TransactionalEmailData['data']) => ({
        subject: `Order Confirmed! #${data.orderNumber || 'N/A'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .order-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .total { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .cta { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Thank You for Your Order!</h1>
    <p>Order #${data.orderNumber || 'N/A'}</p>
  </div>
  <div class="content">
    <p>Hi ${data.customerName || 'there'},</p>
    <p>We've received your order and are getting it ready. Here's what you ordered:</p>
    
    ${data.lineItems?.map(item => `
    <div class="order-item">
      <strong>${item.title}</strong><br>
      Qty: ${item.quantity} × ${data.currency || '$'}${item.price}
    </div>
    `).join('') || '<p>Order details will be sent separately.</p>'}
    
    <p class="total">Total: ${data.currency || '$'}${data.totalPrice || '0.00'}</p>
    
    <p>We'll notify you when your order ships.</p>
    
    <a href="${STORE_URL}" class="cta">Continue Shopping</a>
    
    <p style="color: #6b7280; font-size: 14px;">Questions? Reply to this email.</p>
  </div>
</body>
</html>
        `,
    }),

    order_shipped: (data: TransactionalEmailData['data']) => ({
        subject: `Your Order Has Shipped! 📦 #${data.orderNumber || 'N/A'}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .tracking-box { background: white; padding: 20px; border-radius: 8px; border: 2px solid #10B981; text-align: center; margin: 20px 0; }
    .cta { display: inline-block; background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Your Order is On Its Way!</h1>
    <p>Order #${data.orderNumber || 'N/A'}</p>
  </div>
  <div class="content">
    <p>Hi ${data.customerName || 'there'},</p>
    <p>Great news! Your order has shipped and is on its way to you.</p>
    
    <div class="tracking-box">
      <p style="margin: 0; color: #6b7280;">Carrier: <strong>${data.carrier || 'Standard Shipping'}</strong></p>
      ${data.trackingNumber ? `<p style="margin: 10px 0 0; font-size: 18px;">Tracking: <strong>${data.trackingNumber}</strong></p>` : ''}
    </div>
    
    ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="cta">Track Your Package</a>` : ''}
    
    <p style="color: #6b7280; font-size: 14px;">Thanks for shopping with us!</p>
  </div>
</body>
</html>
        `,
    }),

    abandoned_cart: (data: TransactionalEmailData['data']) => ({
        subject: `You left something behind! 🛒`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .cart-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; align-items: center; }
    .cart-item img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px; }
    .cta { display: inline-block; background: #F59E0B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛒 Forgot Something?</h1>
  </div>
  <div class="content">
    <p>Hi ${data.customerName || 'there'},</p>
    <p>You left some items in your cart. Complete your order before they're gone!</p>
    
    ${data.lineItems?.map(item => `
    <div class="cart-item">
      ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}">` : ''}
      <div>
        <strong>${item.title}</strong><br>
        <span style="color: #6b7280;">Qty: ${item.quantity}</span>
      </div>
    </div>
    `).join('') || ''}
    
    ${data.subtotal ? `<p style="font-size: 18px;">Subtotal: <strong>$${data.subtotal}</strong></p>` : ''}
    
    <a href="${data.checkoutUrl || STORE_URL}" class="cta">Complete Your Order</a>
    
    <p style="color: #6b7280; font-size: 14px;">Need help? Reply to this email.</p>
  </div>
</body>
</html>
        `,
    }),

    shopify_welcome: (data: TransactionalEmailData['data']) => ({
        subject: `Welcome to ${STORE_NAME}! 🎉`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .cta { display: inline-block; background: #8B5CF6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .perks { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .perks li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to ${STORE_NAME}! 🎉</h1>
  </div>
  <div class="content">
    <p>Hi ${data.firstName || 'there'},</p>
    <p>Thanks for creating an account with us! We're excited to have you.</p>
    
    <div class="perks">
      <h3 style="margin-top: 0;">As a member, you get:</h3>
      <ul>
        <li>✨ Exclusive deals and early access to sales</li>
        <li>📦 Easy order tracking</li>
        <li>💝 Special birthday surprises</li>
        <li>⭐ First dibs on new products</li>
      </ul>
    </div>
    
    <a href="${STORE_URL}" class="cta">Start Shopping</a>
    
    <p style="color: #6b7280; font-size: 14px;">Welcome aboard!</p>
  </div>
</body>
</html>
        `,
    }),
};

class TransactionalEmailService {
    /**
     * Send a transactional email based on type
     */
    async send(emailData: TransactionalEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const { type, to, data } = emailData;

        logger.info('Sending transactional email', { type, to });

        const template = templates[type];
        if (!template) {
            logger.error('Unknown transactional email type', { type });
            return { success: false, error: `Unknown email type: ${type}` };
        }

        try {
            const { subject, html } = template(data);

            const result = await emailService.sendMarketingEmail({
                to,
                subject,
                htmlBody: html,
            });

            if (result.success) {
                logger.info('Transactional email sent', { type, to, messageId: result.messageId });
            } else {
                logger.error('Transactional email failed', { type, to, error: result.error });
            }

            return result;
        } catch (error: any) {
            logger.error('Transactional email error', { type, to, error: error.message });
            return { success: false, error: error.message };
        }
    }
}

export const transactionalEmailService = new TransactionalEmailService();
export default transactionalEmailService;
