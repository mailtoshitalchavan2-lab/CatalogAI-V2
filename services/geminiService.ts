
import { GoogleGenAI, Type } from "@google/genai";
import { ProductAnalysis, MainCategory, CameraAngle, LogoPosition, WearableMode, AspectRatio } from "../types";

export class GeminiService {
  async removeBackground(base64Image: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `TASK: BACKGROUND REMOVAL.
            Identify the primary product in this image and remove its background completely.
            The output MUST have a 100% transparent background (alpha channel).
            Maintain the exact shape, color, and texture of the product.
            No halos, artifacts, or remnants of the original background should remain.
            Output as a PNG with transparency.`
          }
        ]
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Background removal failed.");
    }

    // Iterating through parts to find the image part as per guidelines
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from background removal.");
  }

  async checkVideoEligibility(base64Image: string): Promise<{ eligible: boolean, reason?: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1],
                mimeType: 'image/png',
              },
            },
            {
              text: `SAFETY AUDIT: Analyze this product image for commercial video generation eligibility.
              Is this product restricted? Restricted items include:
              - Undergarments / Lingerie / Intimate apparel / Innerwear
              - Swim Innerwear
              - Offensive, sensitive, or unsafe items
              Return ONLY a JSON object with "eligible" (boolean) and "reason" (string explaining why if ineligible).`
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              eligible: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ['eligible']
          }
        }
      });

      if (!response.text) return { eligible: true };
      return JSON.parse(response.text.trim());
    } catch (e) {
      console.error("Eligibility check error:", e);
      return { eligible: false, reason: "Unable to verify product eligibility. Please try again." };
    }
  }

  async generateProductVideo(base64Image: string, prompt: string, selectedRatio: AspectRatio = AspectRatio.MOBILE): Promise<string> {
    // Creating a fresh GoogleGenAI instance right before the API call as per Veo guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // Map selected canvas ratio to model supported video ratios
    // Supported: "9:16" (portrait) or "16:9" (landscape)
    const isLandscape = selectedRatio === AspectRatio.LANDSCAPE || selectedRatio === AspectRatio.WIDESCREEN;
    const videoRatio = isLandscape ? '16:9' : '9:16';

    // The prompt is already pre-configured in the presets to meet Myntra/Amazon catalog standards
    const safetyPrompt = `CATALOG QUALITY STANDARDS:
    - High-end studio cinematography.
    - Focus strictly on product design, color, and fit.
    - NO extreme human emotions, no dramatic posing, no runway walking.
    - NO text, logos, or watermarks.
    - MOVEMENT: ${prompt}`;

    let operation;
    try {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: safetyPrompt,
        image: {
          imageBytes: base64Image.split(',')[1],
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: videoRatio
        }
      });
    } catch (e: any) {
      // Handling mandatory API key selection for Veo models
      if (e.message?.includes("Requested entity was not found.")) {
        if (typeof window !== 'undefined' && window.aistudio) {
          await window.aistudio.openSelectKey();
        }
      }
      throw e;
    }

    if (operation.error) {
      throw new Error(`Safety Filter or Initialization Error: ${operation.error.message}`);
    }

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      // Fresh instance for each poll to ensure up-to-date key
      const pollerAi = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      try {
        operation = await pollerAi.operations.getVideosOperation({ operation: operation });
      } catch (e: any) {
        if (e.message?.includes("Requested entity was not found.")) {
          if (typeof window !== 'undefined' && window.aistudio) {
            await window.aistudio.openSelectKey();
          }
        }
        throw e;
      }
      
      if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("No download link found.");
    }

    // Append API key to fetch request as required for Veo download links
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) throw new Error("Video file retrieval failed.");
    
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  }

  async generatePhotoshoot(
    base64Image: string, 
    prompt: string, 
    aspectRatio: string, 
    preset: string, 
    analysis: ProductAnalysis | null,
    brandLogo?: string | null,
    cameraAngle?: CameraAngle,
    isKitMode: boolean = false,
    logoPosition: LogoPosition = 'bottom-right',
    wearableMode: WearableMode = 'product_only',
    applyWatermark: boolean = false
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const contents: any = {
      parts: [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/png',
          },
        }
      ]
    };

    if (brandLogo) {
      contents.parts.push({
        inlineData: {
          data: brandLogo.split(',')[1],
          mimeType: 'image/png',
        },
      });
    }

    const categoryMapping: Record<string, string> = {
      'Jewellery': 'High-end macro photography. Focus on gemstones and metal luster. Background should be luxurious (velvet, marble, or elegant lifestyle). No faces unless "human" mode is selected.',
      'Fashion': 'Professional apparel photography.',
      'Footwear': 'Focus on construction and style.',
      'Beauty': 'Premium packaging and product detail.',
      'Other': 'Clean commercial presentation.'
    };

    let modeInstruction = '';
    if (analysis?.is_wearable) {
      switch (wearableMode) {
        case 'human':
          modeInstruction = `MODE: Wear on Human Model. Show the product naturally worn on the appropriate human body part. Neutral professional commercial pose. Faces allowed only if necessary for ${analysis.main_category}.`;
          break;
        case 'auto':
          modeInstruction = `MODE: Auto (AI as Professional Photographer). Decide the best marketplace presentation: either on a human model or as a high-end standalone product. Follow best practices for ${analysis.main_category}.`;
          break;
        case 'product_only':
        default:
          modeInstruction = `MODE: Only Product (No Human). Strictly NO human presence, hands, skin, or faces. Use studio lighting, white background, or controlled lifestyle surface.`;
          break;
      }
    } else {
      modeInstruction = `MODE: Product Only. NO human presence allowed.`;
    }

    const brandingInstruction = brandLogo 
      ? `BRAND KIT ACTIVE:
         - Incorporate the provided brand logo into the generated image.
         - POSITION: Place the logo in the ${logoPosition.replace('-', ' ')} corner.
         - SIZE: Logo must be 8% to 12% of the frame width.
         - PADDING: Maintain 4% padding from edges.
         - SAFETY: Never place the logo on faces, skin, or the product itself. Maintain 100% opacity.
         - DO NOT distort or stretch the logo.`
      : 'No brand kit requested.';

    const watermarkInstruction = applyWatermark 
      ? `PROTECTION PROTOCOL:
         - Apply a central "CatalogAi" logo watermark.
         - POSITION: Center of the image.
         - OPACITY: 80% transparent (very subtle/ghosted).
         - SIZE: Scale to cover the central 30% of the frame.
         - INTEGRITY: Do not distort original logo colors. Do not crop.`
      : 'No watermark required.';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...contents.parts,
          {
            text: `You are CatalogAI, a professional photoshoot engine.
            
            TASK: Generate a photoshoot for "${analysis?.product_name || 'item'}".
            SHOT TYPE: "${preset}".
            ASPECT RATIO: ${aspectRatio}.
            
            STYLE RULES:
            - ${modeInstruction}
            - Category Specifics: ${categoryMapping[analysis?.main_category || 'Other']}
            - Product design and color MUST remain 100% accurate.
            - ${brandingInstruction}
            - ${watermarkInstruction}
            - Background: ${prompt || 'Professional studio lighting, high-end commercial backdrop.'}`
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Generation failed.");
    }

    // Iterating through parts to find the image part
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned.");
  }

  async analyzeProduct(base64Image: string): Promise<ProductAnalysis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    // Upgrade to gemini-3-pro-preview for complex reasoning tasks like e-commerce SEO analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `Analyze this product for e-commerce. Return ONLY JSON. 
            Identify if the product is a wearable (Apparel, Jewellery, Footwear, Watches, Sunglasses).
            Provide highly specific marketplace SEO metadata:
            - SEO Title: 60-80 chars, includes type and material.
            - SEO Description: 2-3 natural sentences about craftsmanship.
            - Tags: 6-10 comma-separated keywords.`
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            product_name: { type: Type.STRING },
            main_category: { 
              type: Type.STRING, 
              enum: ['Fashion', 'Jewellery', 'Electronics', 'Beauty', 'FMCG', 'Home', 'Footwear', 'Other'] 
            },
            is_wearable: { type: Type.BOOLEAN },
            suggested_prompt: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            product_title: { type: Type.STRING },
            seo_description: { type: Type.STRING },
            seo_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['product_name', 'main_category', 'is_wearable', 'suggested_prompt', 'confidence_score', 'product_title', 'seo_description', 'seo_keywords', 'tags']
        }
      }
    });

    if (!response.text) {
      throw new Error("Analysis failed.");
    }

    return JSON.parse(response.text.trim()) as ProductAnalysis;
  }
}

export const geminiService = new GeminiService();
