import { env } from '../config/env';

interface EfsAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  email?: string;
}

interface EfsItem {
  sku: string;
  quantity: number;
}

interface EfsOrderInput {
  orderNumber: string;
  shippingMethod: string;
  shippingAddress: EfsAddress;
  items: EfsItem[];
  comments?: string;
}

interface EfsResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  orderStatus?: string;
  error?: string;
  rawResponse: string;
}

const US_COUNTRY_NAMES = ['us', 'usa', 'united states', 'united states of america'];

// EFS's docs specify Country should be an ISO 3166-1 alpha-2 code (e.g. "US"),
// but our checkout forms send full country names ("United States", "UK", "Canada").
const COUNTRY_ISO_MAP: Record<string, string> = {
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  uk: 'GB',
  'united kingdom': 'GB',
  canada: 'CA'
};

export const toIsoCountryCode = (country?: string): string => {
  if (!country) return '';
  const normalized = country.trim().toLowerCase();
  return COUNTRY_ISO_MAP[normalized] || country.trim();
};

// EFS SKUs from the FCP dashboard's Inventory page (Client Info -> View Inventory)
const TAG_COLOR_SKU_MAP: Record<string, string> = {
  blue: 'BPT',
  pink: 'PPT',
  yellow: 'YPT'
};

export const BUBBLE_MAILER_SKU = 'BMS';

export const getTagSku = (color?: string): string =>
  TAG_COLOR_SKU_MAP[(color || 'blue').toLowerCase()] || TAG_COLOR_SKU_MAP.blue;

// One line item per tag color, plus one bubble mailer per tag shipped
export const buildTagItems = (tagColors: string[] | undefined, tagColor: string | undefined, quantity: number): EfsItem[] => {
  const colorCounts: Record<string, number> = {};
  const colorsToShip = (tagColors && tagColors.length > 0) ? tagColors : Array(quantity).fill(tagColor || 'blue');
  for (const color of colorsToShip) {
    const sku = getTagSku(color);
    colorCounts[sku] = (colorCounts[sku] || 0) + 1;
  }
  const items = Object.entries(colorCounts).map(([sku, qty]) => ({ sku, quantity: qty }));
  items.push({ sku: BUBBLE_MAILER_SKU, quantity });
  return items;
};

export const isUsAddress = (country?: string): boolean => {
  if (!country) return false;
  return US_COUNTRY_NAMES.includes(country.trim().toLowerCase());
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildAddressXml = (tag: string, address: EfsAddress): string => {
  const nameFields = address.company
    ? `<Company>${escapeXml(address.company)}</Company>`
    : `<FirstName>${escapeXml(address.firstName || '')}</FirstName><LastName>${escapeXml(address.lastName || '')}</LastName>`;

  return `<${tag}>` +
    nameFields +
    `<Address1>${escapeXml(address.address1)}</Address1>` +
    (address.address2 ? `<Address2>${escapeXml(address.address2)}</Address2>` : '') +
    `<City>${escapeXml(address.city)}</City>` +
    (address.state ? `<State>${escapeXml(address.state)}</State>` : '') +
    (address.postalCode ? `<PostalCode>${escapeXml(address.postalCode)}</PostalCode>` : '') +
    `<Country>${escapeXml(address.country)}</Country>` +
    (address.phone ? `<Phone>${escapeXml(address.phone)}</Phone>` : '') +
    (address.email ? `<Email>${escapeXml(address.email)}</Email>` : '') +
    `</${tag}>`;
};

const buildOrderXml = (order: EfsOrderInput): string => {
  const itemsXml = order.items
    .map(item => `<Item><Sku>${escapeXml(item.sku)}</Sku><Quantity>${item.quantity}</Quantity></Item>`)
    .join('');

  return '<?xml version="1.0" encoding="UTF-8"?>' +
    '<OrderSubmitRequest>' +
    `<Version>${escapeXml(env.EFS_API_VERSION || 'TEST')}</Version>` +
    `<MerchantId>${escapeXml(env.EFS_MERCHANT_ID || '')}</MerchantId>` +
    `<MerchantName>${escapeXml(env.EFS_MERCHANT_NAME || '')}</MerchantName>` +
    `<MerchantToken>${escapeXml(env.EFS_MERCHANT_TOKEN || '')}</MerchantToken>` +
    '<OrderList><Order>' +
    `<OrderNumber>${escapeXml(order.orderNumber)}</OrderNumber>` +
    `<ShippingMethod>${escapeXml(order.shippingMethod)}</ShippingMethod>` +
    buildAddressXml('ShippingAddress', order.shippingAddress) +
    `<ItemList>${itemsXml}</ItemList>` +
    (order.comments ? `<Comments>${escapeXml(order.comments)}</Comments>` : '') +
    '</Order></OrderList>' +
    '</OrderSubmitRequest>';
};

const extractTag = (xml: string, tag: string): string | undefined => {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1].trim() : undefined;
};

export const submitOrderToEfs = async (order: EfsOrderInput): Promise<EfsResult> => {
  if (!env.EFS_API_BASE_URL || !env.EFS_MERCHANT_ID || !env.EFS_MERCHANT_NAME || !env.EFS_MERCHANT_TOKEN) {
    return { success: false, error: 'EFS credentials are not configured', rawResponse: '' };
  }

  const xml = buildOrderXml({
    ...order,
    shippingAddress: {
      ...order.shippingAddress,
      country: toIsoCountryCode(order.shippingAddress.country)
    }
  });
  let rawResponse = '';

  try {
    const response = await fetch(env.EFS_API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml
    });

    rawResponse = await response.text();

    const status = extractTag(rawResponse, 'Status');
    const isError = !response.ok || status !== 'Success';
    if (isError) {
      const errorDescription = extractTag(rawResponse, 'Error') || extractTag(rawResponse, 'Description');
      return {
        success: false,
        error: errorDescription || `EFS request failed with status ${response.status}`,
        rawResponse
      };
    }

    return {
      success: true,
      orderId: extractTag(rawResponse, 'OrderId'),
      orderNumber: extractTag(rawResponse, 'OrderNumber'),
      orderStatus: extractTag(rawResponse, 'OrderStatus'),
      rawResponse
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error calling EFS',
      rawResponse
    };
  }
};
