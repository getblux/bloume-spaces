export const detectIntent = (userInput) => {
    const input = userInput.toLowerCase().trim();
    
    const intents = {
      PERFORMANCE: [
        /how.*(store|business|sales|performance)/i,
        /(store|business).*(doing|performance|analytics)/i,
        /how.*we.*doing|how.*things.*going/i,
        /what.*(happening|going on).*store/i,
        /(check|see|look).*store/i,
        /how.*today.*(sales|business)/i,
        /business.*update|sales.*update/i
      ],
      
      BEST_SELLERS: [
        /what.*selling|best.*selling|top.*product/i,
        /(selling|sales).*(well|good|best)/i,
        /popular.*products|what.*hot/i,
        /which.*products.*popular/i,
        /our.*best.*products/i
      ],
      
      INVENTORY: [
        /low.*stock|running.*out|running.*low|need.*restock/i,
        /stock.*alert|inventory.*low/i,
        /what.*need.*restock|almost.*out/i,
        /which.*out.*of.*stock/i,
        /what.*need.*attention/i,
        /which.*product.*attention/i,
        /what.*should.*restock/i,
        /need.*attention/i,
        /product.*attention/i
      ],
      
      ORDERS: [
        /today.*orders|orders.*today/i,
        /recent.*orders|new.*orders/i,
        /any.*orders.*today/i,
        /pending.*orders|unfulfilled/i,
        /what.*needs.*shipping/i
      ],
      
      CUSTOMERS: [
        /recent.*customers|new.*customers/i,
        /who.*shopping|customer.*activity/i,
        /who.*bought.*recently/i
      ],
  
      CONTENT_HELP: [
        /write.*description|generate.*description/i,
        /help.*description|product.*description/i,
        /describe.*product|create.*description/i,
        /need.*description.*for/i
      ],
      
      NAVIGATION: [
        /go.*to.*(products|orders|customers|analytics)/i,
        /show.*me.*(products|orders|customers)/i,
        /take.*me.*to.*(products|orders)/i,
        /open.*(products|orders|customers)/i,
        /where.*(products|orders|customers)/i
      ],
      
      HELP: [
        /what.*can.*you.*do/i,
        /how.*can.*you.*help/i,
        /what.*commands/i,
        /show.*commands/i,
        /help.*menu/i
      ],
      
      SETTINGS: [
        /change.*(store|whatsapp|number|name)/i,
        /update.*(store|whatsapp|profile)/i,
        /edit.*(store|settings)/i,
        /my.*settings/i,
        /store.*settings/i
      ],
  
      // NEW CRITICAL INTENTS
      ORDER_MANAGEMENT: [
        /mark.*shipped|ship.*order/i,
        /update.*order.*status/i,
        /order.*shipped|shipped.*order/i,
        /fulfill.*order/i,
        /complete.*order/i
      ],
      
      PRICING: [
        /update.*price|change.*price/i,
        /set.*price|price.*to/i,
        /how.*much.*charge/i,
        /pricing.*suggest/i,
        /adjust.*price/i
      ],
      
      MARKETING: [
        /create.*sale|run.*promotion/i,
        /discount|promotion|sale/i,
        /marketing|campaign/i,
        /boost.*sales/i,
        /flash.*sale/i
      ],
      
      CUSTOMER_COMMS: [
        /message.*customer|contact.*customer/i,
        /send.*message.*to/i,
        /notify.*customer/i,
        /email.*customer/i,
        /whatsapp.*customer/i
      ],
      
      FINANCIAL: [
        /revenue|profit|earnings/i,
        /how.*much.*made|how.*much.*earned/i,
        /total.*sales|income/i,
        /money.*made/i,
        /financial.*report/i
      ]
    };
  
    for (const [intent, patterns] of Object.entries(intents)) {
      if (patterns.some(pattern => pattern.test(input))) {
        return intent;
      }
    }
    
    return 'UNKNOWN';
  };