import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createSecureResponse, createSecureErrorResponse } from '../_shared/security.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt, contentType = 'blog', keywords = '', targetAudience = 'men 18-35' } = await req.json();

    if (!prompt) {
      return createSecureErrorResponse('Prompt is required', 400);
    }

    // Define content templates for viral marketing
    const contentTemplates = {
      blog: `You are an expert content marketer for Tea App for Men. Create a viral blog post that will rank #1 on Google and drive massive traffic. 

Target Keywords: ${keywords}
Target Audience: ${targetAudience}

Requirements:
- Hook readers in first 10 words
- Include viral elements that encourage sharing
- SEO optimized with target keywords
- Controversial but tasteful angles
- Include social proof and statistics
- Call-to-action to join Tea App for Men
- 1500+ words for SEO depth

Topic: ${prompt}`,

      social: `You are a viral social media expert for Tea App for Men. Create social media content that will get massive engagement and shares.

Platform focus: Instagram, TikTok, Twitter
Target: ${targetAudience}
Keywords: ${keywords}

Requirements:
- Attention-grabbing hook
- Shareable and quotable content  
- Include trending hashtags
- Controversial but tasteful
- Call-to-action to check out Tea App for Men
- Multiple post variations

Topic: ${prompt}`,

      press: `You are a PR expert writing a press release for Tea App for Men that will get picked up by major media outlets.

Target Keywords: ${keywords}
Angle: Newsworthy and controversial

Requirements:
- Newsworthy headline that will get clicks
- Position as response to viral women's Tea app
- Include quotes from "founders"
- Statistics and market data
- Contact information for interviews
- SEO optimized

Topic: ${prompt}`,

      email: `You are an email marketing expert for Tea App for Men. Create a viral email campaign that will get massive open rates and forwards.

Target: ${targetAudience}
Keywords: ${keywords}

Requirements:
- Subject line that guarantees opens
- Shareable content men will forward
- Social proof and FOMO elements
- Clear call-to-action
- Mobile optimized copy
- Include viral hooks

Topic: ${prompt}`
    };

    const systemPrompt = contentTemplates[contentType as keyof typeof contentTemplates] || contentTemplates.blog;

    console.log('Generating viral content with OpenAI for Tea App for Men...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Add viral marketing enhancements
    const enhancements = {
      seoKeywords: keywords.split(',').map((k: string) => k.trim()),
      viralTriggers: [
        'Exclusive first access',
        'Limited founding member spots',
        'Be part of history',
        'Finally, men have their voice',
        'What women dont want you to know'
      ],
      socialProof: [
        '10,000+ men already joined',
        'Featured in major publications',
        'Verified by security experts',
        'Endorsed by dating coaches'
      ],
      callsToAction: [
        'Join the revolution at teaappformen.com',
        'Get founding member access now',
        'Be among the first 10,000 men',
        'Claim your spot in history'
      ]
    };

    console.log('Content generated successfully');

    return createSecureResponse({
      content: generatedContent,
      enhancements,
      contentType,
      generatedAt: new Date().toISOString(),
      wordCount: generatedContent.split(' ').length
    });

  } catch (error) {
    console.error('Error in viral-content-generator:', error);
    return createSecureErrorResponse(error.message, 500);
  }
});