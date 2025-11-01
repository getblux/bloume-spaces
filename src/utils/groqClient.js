export const groqChat = async (message, firstName) => {
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
              content: `You are a friendly AI assistant for Nigerian e-commerce sellers. Keep responses casual, brief (1-2 lines), and encouraging. User's name is ${firstName}. Respond like a helpful friend.`
            },
            {
              role: 'user', 
              content: message
            }
          ],
          max_tokens: 50, // ← CHANGE THIS LINE
          temperature: 0.7
        })
      });
  
      const data = await response.json();
      return data.choices[0]?.message?.content || `Hi ${firstName}! 😊 How can I help with your store?`;
    } catch (error) {
      console.error('Groq error:', error);
      return `Hey ${firstName}! I'm doing great. What would you like to work on in your store today?`;
    }
  };