import { detectIntent } from './intentDetector';

export const routeAIRequest = (userInput, userContext) => {
  const input = userInput.toLowerCase().trim();
  
  console.log('=== ROUTING DEBUG ===');
  console.log('Input:', input);
  
  // Use intent detection first
  const intent = detectIntent(input);
  console.log('Detected intent:', intent);
  
  // If we detect a clear intent, use predefined handler
  if (intent !== 'UNKNOWN') {
    return { type: 'COMMAND', handler: 'PREDEFINED', intent };
  }
  
  // Casual conversation detection
  if (isCasualMessage(input)) {
    return { type: 'CASUAL', handler: 'GROQ' };
  }
  
  // Fallback to old store command detection (temporary)
  if (isStoreCommand(input)) {
    return { type: 'COMMAND', handler: 'PREDEFINED' };
  }
  
  // Default to Groq for everything else
  return { type: 'GENERAL', handler: 'GROQ' };
};

const isCasualMessage = (input) => {
  const casualPatterns = [
    /^(hi|hello|hey|howdy|sup|yo)/i,
    /how are you|hows it going|whats up|how do you do/i,
    /good morning|good afternoon|good evening|good night/i,
    /thank you|thanks|thx|ty/i,
    /you're welcome|no problem|anytime/i,
    /how was your day|how's your day/i,
    /^(yes|no|yup|nope|maybe)$/i,
    /how are things|what's new/i,
    /nice to see you|good to see you/i,
    /what's happening|whats going on/i,
    /how's life|how have you been/i
  ];
  
  return casualPatterns.some(pattern => pattern.test(input.trim()));
};

const isStoreCommand = (input) => {
  const commandPatterns = [
    /how.*store.*doing|store.*performance|store.*analytics|how.*sales|business.*performance/i,
    /how are we doing|how's business|sales report|revenue.*today/i,
    /best.*selling|top.*products|what.*selling|popular.*products|what's hot/i,
    /which products.*popular|our best products|most sold/i,
    /low.*stock|running.*out|need.*restock|almost.*out|stock.*alert/i,
    /what.*need.*restock|inventory.*low|which.*out of stock/i,
    /today.*orders|orders.*today|recent.*orders|new.*orders/i,
    /any.*orders.*today|how many.*orders.*today|what.*orders.*today/i,
    /recent.*customers|new.*customers|who.*shopping|customer.*activity/i,
    /any.*new.*customers|who.*bought.*recently/i,
    /pending.*orders|orders.*pending|need.*shipping|unfulfilled/i,
    /what.*needs.*shipping|orders.*waiting/i,
    /add.*product|create.*product|new.*product/i,
    /show.*products|view.*products|see.*products|my products/i,
    /orders$|^orders$|view.*orders|see.*orders/i,
    /write.*description|generate.*description|help.*description/i,
    /product.*description|describe.*product/i,
    /help|what can you do|what.*help|how.*you.*help/i
  ];
  
  return commandPatterns.some(pattern => pattern.test(input));
};