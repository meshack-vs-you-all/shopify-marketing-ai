import { logger } from '../utils/logger';

/**
 * Shopify Admin API Service
 * Handles all interactions with Shopify store
 */
class ShopifyService {
  private client: any = null;
  private storeUrl: string;
  private accessToken: string;
  private initialized: boolean = false;

  constructor() {
    this.storeUrl = process.env.SHOPIFY_STORE_URL || '';
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN || '';
  }

  private async initialize(): Promise<boolean> {
    if (this.initialized) return !!this.client;
    this.initialized = true;

    if (!this.storeUrl || !this.accessToken || this.storeUrl === 'your-store.myshopify.com') {
      logger.warn('Shopify credentials not configured. Shopify features disabled.');
      return false;
    }

    try {
      // Dynamic import to avoid crash when credentials are missing
      // await import('@shopify/shopify-api/adapters/node');
      // const { shopifyApi, LATEST_API_VERSION } = await import('@shopify/shopify-api');

      throw new Error('Shopify integration temporarily disabled for OpenRouter testing due to ESM resolution issues.');

      /*
      const shopify = shopifyApi({
        apiKey: process.env.SHOPIFY_API_KEY || '',
        apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
        scopes: ['read_products', 'read_orders', 'read_customers'],
        hostName: this.storeUrl.replace('https://', '').replace('http://', ''),
        apiVersion: LATEST_API_VERSION,
        isEmbeddedApp: false,
      });

      const session = shopify.session.customAppSession(this.storeUrl);
      session.accessToken = this.accessToken;

      this.client = new shopify.clients.Rest({
        session,
      });
      logger.info('Shopify service initialized.');
      return true;
      */
    } catch (error: any) {
      logger.warn('Shopify service failed to initialize: ' + error.message);
      return false;
    }
  }

  /**
   * Get all products from store
   */
  async getProducts(limit: number = 50): Promise<any[]> {
    if (!(await this.initialize())) {
      return [];
    }
    try {
      const response = await this.client.get({
        path: 'products',
        query: { limit },
      });
      return response.body.products || [];
    } catch (error: any) {
      logger.error('Error fetching products from Shopify', { error: error.message });
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(productId: string): Promise<any> {
    try {
      const response = await this.client.get({
        path: `products/${productId}`,
      });
      return response.body.product;
    } catch (error: any) {
      logger.error('Error fetching product from Shopify', { error: error.message, productId });
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  /**
   * Get top-selling products
   */
  async getTopProducts(limit: number = 10): Promise<any[]> {
    try {
      // Get recent orders to determine top products
      const ordersResponse = await this.client.get({
        path: 'orders',
        query: { limit: 250, status: 'any' },
      });

      const orders = ordersResponse.body.orders || [];

      // Count product sales
      const productSales: Record<string, { product: any; sales: number }> = {};

      orders.forEach((order: any) => {
        order.line_items?.forEach((item: any) => {
          const productId = item.product_id?.toString();
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = {
                product: { id: productId, title: item.title },
                sales: 0,
              };
            }
            productSales[productId].sales += item.quantity;
          }
        });
      });

      // Sort by sales and return top products
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit)
        .map(item => item.product);

      return topProducts;
    } catch (error: any) {
      logger.error('Error fetching top products from Shopify', { error: error.message });
      throw new Error(`Failed to fetch top products: ${error.message}`);
    }
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<any[]> {
    try {
      const response = await this.client.get({
        path: 'custom_collections',
      });
      const customCollections = response.body.custom_collections || [];

      const smartResponse = await this.client.get({
        path: 'smart_collections',
      });
      const smartCollections = smartResponse.body.smart_collections || [];

      return [...customCollections, ...smartCollections];
    } catch (error: any) {
      logger.error('Error fetching collections from Shopify', { error: error.message });
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }
  }

  /**
   * Get store analytics data
   */
  async getStoreAnalytics(): Promise<any> {
    try {
      // Get recent orders for analytics
      const ordersResponse = await this.client.get({
        path: 'orders',
        query: { limit: 250, status: 'any' },
      });

      const orders = ordersResponse.body.orders || [];

      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_price || 0), 0),
        averageOrderValue: 0,
        orderCount: orders.length,
      };

      analytics.averageOrderValue = analytics.totalRevenue / (analytics.orderCount || 1);

      return analytics;
    } catch (error: any) {
      logger.error('Error fetching store analytics from Shopify', { error: error.message });
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  }

  /**
   * Test connection to Shopify
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get({ path: 'shop' });
      return true;
    } catch (error) {
      logger.error('Shopify connection test failed', { error });
      return false;
    }
  }
}

export const shopifyService = new ShopifyService();
export default shopifyService;

