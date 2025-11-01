import { GEMINI_API_KEY } from './gemini';

export const generateDescription = async (title, category, bio) => {
  try {
    const prompt = `Create a compelling 150-word description for a paid community called "${title}" in the ${category} category. 
    The community focuses on: ${bio}. 
    Write an engaging description that makes people want to join and highlights the value they'll get.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    const data = await response.json();
    console.log('Full API response:', data);
    
    if (data.error) {
      console.error('Gemini API error:', data.error);
      return `API Error: ${data.error.message || 'Please try again'}`;
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "Could not generate description. Unexpected response format.";
    }
  } catch (error) {
    console.error('Network error:', error);
    return "Failed to connect to AI service. Please check your internet and try again.";
  }
};