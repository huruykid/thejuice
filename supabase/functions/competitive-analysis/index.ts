import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createSecureResponse, createSecureErrorResponse, authenticateRequest, requireAdmin } from '../_shared/security.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const adminCheck = await requireAdmin(auth.userId);
    if (adminCheck) return adminCheck;

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { 
      competitors = ['tea app', 'dating apps', 'reddit dating'], 
      targetKeywords = ['tea app for men', 'male dating stories', 'men dating advice'],
      analysisType = 'seo' 
    } = await req.json();

    const analysisPrompts = {
      seo: `You are an expert SEO analyst. Analyze the competitive landscape for Tea App for Men against these competitors: ${competitors.join(', ')}

Target Keywords: ${targetKeywords.join(', ')}

Provide detailed analysis:
1. Keyword gaps and opportunities
2. Content strategy recommendations  
3. Link building opportunities
4. Technical SEO advantages we can exploit
5. SERP feature opportunities
6. Local SEO tactics
7. Specific action items to outrank competitors

Be specific and actionable. Focus on tactics that will work in 2024.`,

      content: `You are a content strategy expert. Analyze content gaps for Tea App for Men vs competitors: ${competitors.join(', ')}

Target Keywords: ${targetKeywords.join(', ')}

Identify:
1. Content topics competitors are missing
2. Viral content opportunities
3. SEO content gaps to exploit
4. Social media content strategies
5. Video content opportunities
6. Community building content
7. Thought leadership angles

Provide specific content calendar ideas and viral hooks.`,

      viral: `You are a viral marketing expert. Analyze how Tea App for Men can dominate against: ${competitors.join(', ')}

Focus on:
1. Viral growth hacks and tactics
2. Social media domination strategies  
3. Influencer partnership opportunities
4. PR and media coverage angles
5. Community-driven growth tactics
6. Referral and sharing mechanisms
7. Controversy marketing (tasteful)

Provide specific, executable viral marketing campaigns.`,

      market: `You are a market researcher. Analyze the competitive positioning for Tea App for Men vs: ${competitors.join(', ')}

Research:
1. Market gaps and opportunities
2. Underserved audience segments
3. Pricing and monetization gaps
4. Feature differentiation opportunities  
5. Brand positioning advantages
6. Geographic expansion opportunities
7. Partnership and collaboration opportunities

Provide strategic recommendations for market domination.`
    };

    const systemPrompt = analysisPrompts[analysisType as keyof typeof analysisPrompts] || analysisPrompts.seo;

    console.log(`Running ${analysisType} competitive analysis...`);

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
            content: `Provide a comprehensive competitive analysis for Tea App for Men. Focus on actionable insights that will help us crush the competition and dominate search rankings.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
        top_p: 0.9
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Add competitive intelligence
    const competitiveIntel = {
      analysisType,
      competitors,
      targetKeywords,
      generatedAt: new Date().toISOString(),
      actionItems: analysis.split('\n').filter((line: string) => 
        line.includes('Action:') || 
        line.includes('Recommendation:') || 
        line.includes('Tactic:') ||
        line.includes('Strategy:')
      ),
      opportunities: [
        'First-mover advantage in male dating community',
        'Counter-narrative to viral womens Tea app',
        'Untapped SEO keywords for male dating',
        'Zero verified male dating review platforms',
        'Massive pent-up demand from men feeling excluded'
      ]
    };

    console.log('Competitive analysis completed successfully');

    return createSecureResponse({
      analysis,
      intelligence: competitiveIntel,
      analysisType,
      wordCount: analysis.split(' ').length
    });

  } catch (error) {
    console.error('Error in competitive-analysis:', error);
    return createSecureErrorResponse('Internal server error', 500);
  }
});