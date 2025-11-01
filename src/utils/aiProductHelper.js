// In aiProductHelper.js
export const generateProductDescription = async (productName, price) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are an ecommerce expert for Nigerian SMEs. Generate product details in EXACT JSON format:
              
              {
                "description": "Compelling 2-3 line description focusing on benefits for Nigerian customers",
                "category": "Single relevant category name like Electronics, Audio, Gadgets"
              }
              
              Rules:
              - Description: 2-3 lines max, persuasive, highlight durability, battery life, sound quality
              - Category: Simple, standard ecommerce category (no creative names)
              - Be practical and relevant to Nigerian market`
            },
            {
              role: 'user',
              content: `Product: ${productName}, Price: ₦${price}`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });
  
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      return parseAIResponse(content, productName); // Pass productName here
    } catch (error) {
      console.error('AI generation error:', error);
      return { description: '', category: '' };
    }
  };
  
  const parseAIResponse = (content, productName) => { // Add productName parameter
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || '',
          category: parsed.category || ''
        };
      }
      
      // Fallback: simple text parsing
      const lines = content.split('\n').filter(line => line.trim());
      let description = '';
      let category = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        if (line.includes('description:') && !description) {
          description = lines[i].replace(/description:\s*/i, '').trim();
        } else if (line.includes('category:') && !category) {
          category = lines[i].replace(/category:\s*/i, '').trim();
        }
      }
      
      // If still no category, use common fallbacks
      if (!category) {
        category = getDefaultCategory(productName);
      }
      
      return { description, category };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return { description: '', category: '' };
    }
  };
  
  const getDefaultCategory = (productName) => {
    const name = productName.toLowerCase();
    
    if (name.includes('speaker') || name.includes('audio')) return 'Electronics';
    if (name.includes('phone') || name.includes('mobile')) return 'Mobile Phones';
    if (name.includes('shoe') || name.includes('footwear')) return 'Fashion';
    if (name.includes('shirt') || name.includes('cloth')) return 'Fashion';
    if (name.includes('bag') || name.includes('purse')) return 'Accessories';
    if (name.includes('watch')) return 'Accessories';
    if (name.includes('laptop') || name.includes('computer')) return 'Computing';
    
    return 'General';
  };