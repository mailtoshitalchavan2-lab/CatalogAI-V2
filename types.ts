
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  originalUrl?: string;
  fileName?: string;
  logoUrl?: string;
  shotType?: string;
  analysis?: ProductAnalysis;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  prompt: string;
  preset: VideoPreset;
  timestamp: number;
  fileName: string;
  sku?: string;
  aspectRatio?: string;
  analysis?: ProductAnalysis;
}

export type VideoPresetId = 
  | 'jewellery_myntra_model' 
  | 'jewellery_amazon_flat' 
  | 'fashion_myntra_model' 
  | 'product_amazon_no_model';

export interface VideoPreset {
  id: VideoPresetId;
  label: string;
  description: string;
  category: MainCategory | 'All';
  prompt: string;
}

export const VideoPresets: VideoPreset[] = [
  {
    id: 'jewellery_myntra_model',
    label: 'Jewellery – Myntra Style (On Model)',
    description: 'High-end close-up with a model turning head left and right. Subtle earring swing.',
    category: 'Jewellery',
    prompt: 'A Myntra-style premium jewellery product video. A professional female fashion model wearing the exact jewellery. Natural soft smile. Model gently turns head left and right. Earrings swing subtly with movement. Camera remains stable, medium close-up framing. Soft studio lighting, neutral background. Luxury fashion catalog look. No text, no branding, no watermark. Focus strictly on jewellery.'
  },
  {
    id: 'jewellery_amazon_flat',
    label: 'Jewellery – Amazon Style (Flat Lay 360°)',
    description: 'Slow 360° rotation on premium surface. Macro focus on craftsmanship.',
    category: 'Jewellery',
    prompt: 'An Amazon-style flat lay product video. The jewellery placed on premium fabric or matte surface. Slow 360-degree rotation. Macro focus on stones, polish, and craftsmanship. Soft directional lighting. Clean white or luxury neutral background. No hands, no humans. No text or logo overlays.'
  },
  {
    id: 'fashion_myntra_model',
    label: 'Fashion – Myntra Style (On Model)',
    description: 'Subtle rotation to show front and side fit. Focus on fabric fall.',
    category: 'Fashion',
    prompt: 'A Myntra-style fashion product video. Model wearing the exact clothing product. Neutral expression with confident posture. Subtle body rotation to show front and side view. Natural fabric movement visible. Studio lighting with soft shadows. Plain background. No runway walk. No dramatic posing. No text or logos.'
  },
  {
    id: 'product_amazon_no_model',
    label: 'Product – Amazon Style (No Model)',
    description: 'Pure catalog turntable rotation for bags, shoes, and non-wearables.',
    category: 'Other',
    prompt: 'An Amazon-style product showcase video. The product placed on a neutral studio surface. Slow turntable rotation. Multiple angles visible naturally. Soft shadows and clean lighting. No human interaction. No branding or text overlays. Pure catalog-grade presentation.'
  }
];

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  MOBILE = '9:16',
  WIDESCREEN = '16:9'
}

export type WearableMode = 'auto' | 'human' | 'product_only';

export type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-right';

export type CameraAngle = 'front' | 'back' | 'left' | 'right' | '45_degree_left' | '45_degree_right';

export type MainCategory = 'Fashion' | 'Jewellery' | 'Electronics' | 'Beauty' | 'FMCG' | 'Home' | 'Footwear' | 'Other';

export type PlanId = 'free' | 'pro' | 'premium';

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;
  tokens: number;
  watermark: boolean;
  canTopUp: boolean;
  features: {
    kit: boolean;
    angles: boolean;
    zip: boolean;
    seo: boolean;
    csv: boolean;
    skuNaming: boolean;
    videoGeneration: boolean;
  };
}

export const Plans: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    tokens: 10,
    watermark: true,
    canTopUp: false,
    features: {
      kit: true,
      angles: true,
      zip: true,
      seo: false,
      csv: false,
      skuNaming: false,
      videoGeneration: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 999,
    tokens: 50,
    watermark: false,
    canTopUp: true,
    features: {
      kit: true,
      angles: true,
      zip: true,
      seo: true,
      csv: true,
      skuNaming: true,
      videoGeneration: false
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    price: 1999,
    tokens: 150,
    watermark: false,
    canTopUp: true,
    features: {
      kit: true,
      angles: true,
      zip: true,
      seo: true,
      csv: true,
      skuNaming: true,
      videoGeneration: true
    }
  }
};

export const KitAngles: Record<MainCategory, string[]> = {
  Fashion: ['Front View', 'Back View', '45 Degree View', 'Side Profile', 'Detail Closeup'],
  Jewellery: ['Front Closeup', 'Wear Shot', '45 Degree Closeup', 'Macro Detail', 'Lifestyle Wear'],
  Footwear: ['Side View', 'Front View', 'Back View', 'Top View', 'On-Foot Wear'],
  Electronics: ['Front View', 'Back View', 'Side Profile', '45 Degree View', 'In-Hand Usage'],
  Beauty: ['Front Packshot', '45 Degree Packshot', 'Texture Swatch', 'Hand Application', 'Vanity Lifestyle'],
  FMCG: ['Front Packshot', '45 Degree Packshot', 'Top View', 'Ingredient Closeup', 'Usage Context'],
  Home: ['Front View', '45 Degree Room View', 'Side View', 'Texture Detail', 'Lifestyle Room Setup'],
  Other: ['Hero Shot', 'Alternate View', 'Close-up Shot', 'Usage Shot', 'Contextual Scene']
};

export const CategoryPresets: Record<MainCategory, string[]> = {
  Fashion: ['Main Hero Wear', 'Side Angle View', 'Detail Closeup', 'Lifestyle Context', 'Editorial Shot'],
  Jewellery: ['Luxury Studio Shot', 'Macro Detail', 'Model Wear Shot', 'Angle View', 'Elegant Context'],
  Electronics: ['Tech Packshot', 'Ports & Side Profile', 'Interface Macro', 'Handheld Usage', 'Workspace Scene'],
  Beauty: ['Product Packshot', 'Texture Swatch', 'Application Shot', 'Packaging Depth', 'Minimalist Vanity'],
  FMCG: ['Surface Packshot', '3/4 Angle View', 'Label Detail', 'Serving Action', 'Lifestyle Table'],
  Home: ['Isolated Product', 'Room Interior', 'Functional Usage', 'Material Macro', 'Spatial Profile'],
  Footwear: ['Side-Front Studio', 'Sole & Heel Profile', 'Material Focus', 'On-Model Walking', 'Outdoor Context'],
  Other: ['Hero Shot', 'Alternate View', 'Close-up Shot', 'Usage Shot', 'Contextual Scene']
};

export interface ProductAnalysis {
  product_name: string;
  main_category: MainCategory;
  is_wearable: boolean;
  suggested_prompt: string;
  confidence_score: number;
  product_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  tags?: string[];
}

export interface BatchItem {
  id: string;
  fileName: string;
  base64: string;
  analysis: ProductAnalysis | null;
  status: 'pending' | 'analyzing' | 'ready' | 'generating' | 'completed' | 'error';
  error?: string;
  selectedAngle?: CameraAngle;
  wearableMode?: WearableMode;
}
