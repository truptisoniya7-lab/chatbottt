const { query } = require('../config/database');

const definitions = [
  {
    type: 'function',
    function: {
      name: 'search_catalogue',
      description: 'Search Vasudha Couture product catalogue with filters. Use for any product recommendation request.',
      parameters: {
        type: 'object',
        properties: {
          category:  { type: 'string', description: 'saree, lehenga, kurta, shirt, dress, jeans, sherwani, dupatta, anarkali' },
          gender:    { type: 'string', enum: ['women','men','unisex'] },
          max_price: { type: 'number', description: 'Maximum price in INR' },
          min_price: { type: 'number', description: 'Minimum price in INR' },
          occasion:  { type: 'string', description: 'E.g. wedding, festive, office, casual, sangeet, reception' },
          fabric:    { type: 'string', description: 'E.g. silk, cotton, georgette, linen, chiffon, chanderi' },
          colour:    { type: 'string', description: 'Colour name or family' },
          limit:     { type: 'number', description: 'Max products to return, default 4' },
        },
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Fetch real-time order status.',
      parameters: {
        type: 'object',
        properties: {
          order_id:      { type: 'string', description: 'Order ID like VC-20245781.' },
          phone_last4:   { type: 'string', description: 'Last 4 digits of registered phone.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'initiate_return',
      description: 'Create a return or exchange request for a delivered order.',
      parameters: {
        type: 'object',
        properties: {
          order_id:    { type: 'string' },
          reason:      { type: 'string' },
          return_type: { type: 'string', enum: ['refund','exchange'] }
        },
        required: ['order_id', 'reason', 'return_type'],
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_size_recommendation',
      description: 'Calculate recommended garment size from body measurements.',
      parameters: {
        type: 'object',
        properties: {
          category:   { type: 'string', description: 'Garment category (e.g. kurta, lehenga, dress)' },
          chest_cm:   { type: 'number' },
          waist_cm:   { type: 'number' }
        },
        required: ['category'],
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'lookup_promo',
      description: 'Get current active promotions and discount codes.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_faqs',
      description: 'Get answers to frequently asked questions.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Keywords from user query to match FAQs' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_fabric_care',
      description: 'Get care instructions for specific fabrics.',
      parameters: {
        type: 'object',
        properties: {
          fabric: { type: 'string', description: 'Name of fabric (e.g. Silk, Cotton, Georgette)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_store_policies',
      description: 'Get information about shipping, payments, and returns policies.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', enum: ['shipping', 'returns', 'payments'], description: 'Which policy to lookup' }
        },
        required: ['topic']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_agent',
      description: 'Create a Freshdesk support ticket and escalate to human agent. Use when issue cannot be resolved after 2 attempts or user explicitly asks.',
      parameters: {
        type: 'object',
        properties: {
          issue_summary:   { type: 'string' },
          chat_transcript: { type: 'string' }
        },
        required: ['issue_summary', 'chat_transcript'],
      }
    }
  }
];

async function execute(name, args, user) {
  switch (name) {
    case 'search_catalogue': {
      let sql = 'SELECT data FROM products WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (args.category) {
          sql += ` AND category ILIKE $${paramCount++}`;
          params.push(`%${args.category}%`);
      }
      if (args.max_price) {
          sql += ` AND price <= $${paramCount++}`;
          params.push(args.max_price);
      }
      if (args.min_price) {
          sql += ` AND price >= $${paramCount++}`;
          params.push(args.min_price);
      }
      if (args.occasion) {
          sql += ` AND occasion ILIKE $${paramCount++}`;
          params.push(`%${args.occasion}%`);
      }
      if (args.fabric) {
          sql += ` AND fabric ILIKE $${paramCount++}`;
          params.push(`%${args.fabric}%`);
      }
      
      sql += ` LIMIT $${paramCount}`;
      params.push(args.limit || 4);

      try {
          const res = await query(sql, params);
          return { results: res.rows.map(row => row.data) };
      } catch (e) {
          console.error('search_catalogue error:', e);
          return { error: 'Database search failed.' };
      }
    }
    case 'get_order_status': {
      try {
          if (args.order_id) {
              const res = await query('SELECT data FROM orders WHERE order_id = $1', [args.order_id]);
              if (res.rows.length > 0) return res.rows[0].data;
              return { error: 'Order not found.' };
          }
          if (args.phone_last4) {
              const res = await query('SELECT data FROM orders WHERE phone_last4 = $1', [args.phone_last4]);
              if (res.rows.length > 0) return { orders: res.rows.map(r => r.data) };
              return { error: 'No orders found for this phone number.' };
          }
          return { error: 'Provide order_id or phone_last4.' };
      } catch (e) {
          return { error: 'Database query failed.' };
      }
    }
    case 'initiate_return': {
      try {
          const res = await query('SELECT data FROM orders WHERE order_id = $1', [args.order_id]);
          if (res.rows.length === 0) return { error: 'Order not found.' };
          return { success: true, return_id: `RT-NEW-${Date.now()}`, status: 'Initiated', message: `Return recorded for ${args.order_id}.` };
      } catch (e) {
          return { error: 'Return processing failed.' };
      }
    }
    case 'get_size_recommendation': {
      if (args.category === 'kurta' || args.category === 'sherwani') {
          if (args.chest_cm) {
              if (args.chest_cm <= 90) return { recommended_size: 'S' };
              if (args.chest_cm <= 96) return { recommended_size: 'M' };
              if (args.chest_cm <= 102) return { recommended_size: 'L' };
              if (args.chest_cm <= 108) return { recommended_size: 'XL' };
              return { recommended_size: 'XXL' };
          }
          return { error: 'Please provide chest_cm.' };
      }
      return { message: `For ${args.category}, please refer to our general size guide or provide more measurements.` };
    }
    case 'lookup_promo': {
      const res = await query("SELECT data FROM knowledge_base_docs WHERE topic = 'promotions'");
      return res.rows.length > 0 ? res.rows[0].data : { error: 'No promos found' };
    }
    case 'get_faqs': {
      const res = await query("SELECT data FROM knowledge_base_docs WHERE topic = 'faqs'");
      return res.rows.length > 0 ? res.rows[0].data : { error: 'No FAQs found' };
    }
    case 'get_fabric_care': {
      const res = await query("SELECT data FROM knowledge_base_docs WHERE topic = 'fabric_care'");
      if (res.rows.length > 0) {
          const careData = res.rows[0].data.fabric_care;
          if (args.fabric && careData) {
              const care = careData.find(f => f.fabric_name.toLowerCase().includes(args.fabric.toLowerCase()));
              if (care) return care;
          }
          return res.rows[0].data;
      }
      return { error: 'Fabric care not found' };
    }
    case 'get_store_policies': {
      let dbTopic = args.topic;
      const res = await query("SELECT data FROM knowledge_base_docs WHERE topic = $1", [dbTopic]);
      return res.rows.length > 0 ? res.rows[0].data : { error: 'Policy not found' };
    }
    case 'escalate_to_agent':
      return { success: true, ticket_id: `FD-${Date.now()}`, expected_response_time: '2-4 hours' };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

module.exports = {
  definitions,
  execute
};
