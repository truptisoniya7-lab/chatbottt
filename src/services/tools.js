const definitions = [
  {
    type: "function",
    function: {
      name: 'search_catalogue',
      description: 'Search Vasudha Couture product catalogue with filters. Use for any product recommendation request.',
      parameters: {
        type: "object",
        properties: {
          category:  { type: "string", description: 'saree, lehenga, kurta, etc' },
          occasion:  { type: "string", description: 'wedding, festive, casual' },
          max_price: { type: "number", description: 'Maximum price in INR' }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'get_order_status',
      description: 'Fetch real-time order status.',
      parameters: {
        type: "object",
        properties: {
          order_id:      { type: "string", description: 'Order ID' },
          phone_last4:   { type: "string", description: 'Last 4 digits of phone. Required for guests' },
          fetch_recent:  { type: "boolean", description: 'Fetch recent orders for logged-in users' }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'initiate_return',
      description: 'Create a return or exchange request for a delivered order.',
      parameters: {
        type: "object",
        properties: {
          order_id:    { type: "string" },
          reason:      { type: "string", description: 'Return reason' },
          return_type: { type: "string", description: 'refund, exchange, store_credit' }
        },
        required: ['order_id', 'reason', 'return_type']
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'get_size_recommendation',
      description: 'Calculate recommended garment size from body measurements.',
      parameters: {
        type: "object",
        properties: {
          category:   { type: "string", description: 'Garment category' },
          bust_cm:    { type: "number" },
          waist_cm:   { type: "number" },
          unit:       { type: "string", description: 'cm or inches' }
        },
        required: ['category']
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'escalate_to_agent',
      description: 'Create a Freshdesk support ticket and escalate to human agent.',
      parameters: {
        type: "object",
        properties: {
          issue_summary:   { type: "string" },
          priority:        { type: "string", enum: ['low', 'medium', 'high'], description: 'low, medium, high' },
          user_email:      { type: "string" }
        },
        required: ['issue_summary']
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'lookup_promo',
      description: 'Get current active promotions, discount codes, and sale information.',
      parameters: {
        type: "object",
        properties: {
          context: { type: "string" }
        }
      }
    }
  }
];

async function execute(name, args, user) {
  if (name === 'search_catalogue') {
    return {
      status: "success",
      products: [
        { id: "P101", name: "Banarasi Saree", price: 12999, category: "saree", url: "/product/P101" },
        { id: "P102", name: "Silk Lehenga", price: 24999, category: "lehenga", url: "/product/P102" },
        { id: "P103", name: "Linen Kurta", price: 2499, category: "kurta", url: "/product/P103" }
      ]
    };
  }

  if (name === 'get_order_status') {
    if (!user && (!args.order_id || !args.phone_last4)) {
       return { status: "error", message: "Please provide order_id and phone_last4 to track as a guest." };
    }
    return {
      status: "success",
      orders: [
        {
          order_id: args.order_id || "VC-20245781",
          items: ["Linen Kurta"],
          status: "OUT FOR DELIVERY",
          courier: "Delhivery",
          expected_delivery: "Today by 8 PM"
        }
      ]
    };
  }
  
  if (name === 'initiate_return') {
      return {
          status: "success",
          return_id: "RT-20248823",
          pickup_eta: "2-3 business days",
          refund_eta: "5-7 business days"
      };
  }
  
  if (name === 'get_size_recommendation') {
      return {
          status: "success",
          recommended_size: "L",
          fit_notes: "This style has a contemporary fitted silhouette. Large provides a comfortable drape."
      };
  }
  
  if (name === 'escalate_to_agent') {
      return {
          status: "success",
          ticket_id: "#FD-7742",
          expected_response: "2-4 hours (Mon-Sat, 9 AM - 9 PM IST)"
      };
  }
  
  if (name === 'lookup_promo') {
      return {
          status: "success",
          promotions: [
              { code: "VASUDHA15", description: "15% off all sarees", expiry: "June 30" },
              { code: "FIRSTLOOK", description: "10% off your first order", expiry: "No expiry" }
          ]
      };
  }
  
  return { status: "error", message: "Tool not found or implemented" };
}

module.exports = { definitions, execute };
