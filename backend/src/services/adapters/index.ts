/**
 * Platform Adapters Index
 * Export all Meta platform adapters for unified access
 */

export { FacebookAdapter, facebookAdapter, type FacebookPostParams, type FacebookPostResult } from './facebook.adapter';
export { InstagramAdapter, instagramAdapter, type InstagramPostParams, type InstagramPostResult, type InstagramMediaType } from './instagram.adapter';
export { WhatsAppAdapter, whatsappAdapter, type WhatsAppTemplateParams, type WhatsAppMessageResult } from './whatsapp.adapter';
export { withRetry, graphApiRequest, checkScopes, type MetaApiResponse, type PublishResult, META_API_VERSION, META_GRAPH_BASE_URL } from './base.adapter';
