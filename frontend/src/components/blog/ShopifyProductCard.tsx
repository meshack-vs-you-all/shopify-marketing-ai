
import Link from 'next/link';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

interface ProductData {
    id: number;
    title: string;
    handle: string;
    vendor?: string;
    image?: {
        src: string;
    };
    variants?: Array<{
        price: string;
        compare_at_price?: string | null;
    }>;
}

interface ShopifyProductCardProps {
    product: ProductData;
}

export default function ShopifyProductCard({ product }: ShopifyProductCardProps) {
    if (!product) return null;

    const price = product.variants?.[0]?.price;
    const comparePrice = product.variants?.[0]?.compare_at_price;
    const imageSrc = product.image?.src || '';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-sm mx-auto my-8 hover:shadow-md transition-shadow duration-300">
            <div className="relative aspect-square bg-gray-100">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={product.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>

            <div className="p-5">
                <p className="text-xs text-gray-500 font-medium mb-1">{product.vendor}</p>
                <h4 className="text-lg font-bold text-gray-900 line-clamp-1 mb-2">
                    {product.title}
                </h4>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                        {comparePrice && (
                            <span className="text-xs text-gray-500 line-through">
                                ${comparePrice}
                            </span>
                        )}
                        <span className="text-lg font-bold text-primary-600">
                            ${price}
                        </span>
                    </div>

                    <a
                        href={`https://glowifybabystores.com/products/${product.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <ShoppingBagIcon className="w-4 h-4" />
                        Buy Now
                    </a>
                </div>
            </div>
        </div>
    );
}
