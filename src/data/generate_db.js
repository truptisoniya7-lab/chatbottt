const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'modules');
if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
}

const db = {
    categories: [
        { category_id: "CAT-001", category_slug: "saree", category_name: "Sarees", gender: "women", total_styles: 340, website_section: "Women's Finest" },
        { category_id: "CAT-002", category_slug: "kurta", category_name: "Kurtas", gender: "unisex", total_styles: 280, website_section: "Women's Finest / Men's Signatures" },
        { category_id: "CAT-003", category_slug: "lehenga", category_name: "Lehengas", gender: "women", total_styles: 180, website_section: "Women's Finest" },
        { category_id: "CAT-004", category_slug: "shirt", category_name: "Shirts", gender: "men", total_styles: 420, website_section: "Men's Signatures" },
        { category_id: "CAT-005", category_slug: "dress", category_name: "Dresses", gender: "women", total_styles: 310, website_section: "Women's Finest" },
        { category_id: "CAT-006", category_slug: "jeans", category_name: "Jeans & Trousers", gender: "men", total_styles: 200, website_section: "Men's Signatures" },
        { category_id: "CAT-007", category_slug: "ethnic-wear", category_name: "Ethnic Wear", gender: "unisex", total_styles: 550, website_section: "Ethnic Spotlight" },
        { category_id: "CAT-008", category_slug: "sherwani", category_name: "Sherwanis", gender: "men", total_styles: 95, website_section: "Men's Signatures" },
        { category_id: "CAT-009", category_slug: "dupatta", category_name: "Dupattas", gender: "women", total_styles: 120, website_section: "Women's Finest" },
        { category_id: "CAT-010", category_slug: "blazer", category_name: "Blazers", gender: "men", total_styles: 80, website_section: "Men's Signatures" },
        { category_id: "CAT-011", category_slug: "anarkali", category_name: "Anarkali Suits", gender: "women", total_styles: 145, website_section: "Women's Finest" },
        { category_id: "CAT-012", category_slug: "ethnic-set", category_name: "Kurta Sets", gender: "women", total_styles: 210, website_section: "Women's Finest" }
    ],
    products_women: [
        { product_id: "VC-W-001", name: "Banarasi Silk Zari Saree", category: "saree", fabric: "Pure Silk", price: 8499, mrp: 12000, discount_pct: 29, occasion: "Wedding · Festive", region_origin: "Varanasi UP", badge: "New In", in_stock: true, sizes_available: ["Free Size (5.5m)"], colours: ["Magenta", "Royal Blue", "Emerald Green", "Gold"] },
        { product_id: "VC-W-002", name: "Embroidered Bridal Lehenga", category: "lehenga", fabric: "Net + Velvet", price: 14999, mrp: 21000, discount_pct: 29, occasion: "Bridal · Wedding", region_origin: "Surat Gujarat", badge: "Sale", in_stock: true, sizes_available: ["XS", "S", "M", "L", "XL"], colours: ["Magenta", "Red", "Ivory"] },
        { product_id: "VC-W-003", name: "Floral Maxi Dress", category: "dress", fabric: "Chiffon", price: 3299, mrp: 3299, discount_pct: 0, occasion: "Casual · Beach", region_origin: "—", badge: "—", in_stock: true, sizes_available: ["XS", "S", "M", "L", "XL", "XXL"], colours: ["Pink", "White", "Yellow"] },
        { product_id: "VC-W-004", name: "Georgette Anarkali Suit", category: "anarkali", fabric: "Georgette", price: 5499, mrp: 5499, discount_pct: 0, occasion: "Festive · Party", region_origin: "Lucknow UP", badge: "New", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["Navy", "Peach", "Teal"] },
        { product_id: "VC-W-005", name: "Chikankari Kurta Set", category: "ethnic-set", fabric: "Cotton", price: 2799, mrp: 3499, discount_pct: 20, occasion: "Casual · Office", region_origin: "Lucknow UP", badge: "Sale", in_stock: true, sizes_available: ["XS", "S", "M", "L", "XL"], colours: ["White", "Powder Blue", "Pastel Pink"] },
        { product_id: "VC-W-006", name: "Kanjivaram Silk Dupatta", category: "dupatta", fabric: "Kanjivaram Silk", price: 2199, mrp: 2800, discount_pct: 21, occasion: "Wedding · Festive", region_origin: "Kanchipuram TN", badge: "—", in_stock: true, sizes_available: ["Free Size"], colours: ["Maroon", "Gold", "Peacock Blue"] },
        { product_id: "VC-W-007", name: "Printed Palazzo Set", category: "ethnic-set", fabric: "Rayon", price: 1899, mrp: 2400, discount_pct: 20, occasion: "Casual · Lounge", region_origin: "Jaipur Rajasthan", badge: "—", in_stock: true, sizes_available: ["XS", "S", "M", "L", "XL"], colours: ["Floral Pink", "Indigo Print", "Rust"] },
        { product_id: "VC-W-008", name: "Chanderi Cotton Saree", category: "saree", fabric: "Chanderi Cotton", price: 3499, mrp: 3499, discount_pct: 0, occasion: "Office · Casual", region_origin: "Chanderi MP", badge: "—", in_stock: true, sizes_available: ["Free Size (5.5m)"], colours: ["Ivory", "Lilac", "Sage Green"] },
        { product_id: "VC-W-009", name: "Georgette Embroidered Saree", category: "saree", fabric: "Georgette", price: 5999, mrp: 5999, discount_pct: 0, occasion: "Festive · Party", region_origin: "—", badge: "—", in_stock: true, sizes_available: ["Free Size (5.5m)"], colours: ["Peach", "Silver", "Black"] },
        { product_id: "VC-W-010", name: "Kalamkari Art Saree", category: "saree", fabric: "Cotton", price: 4299, mrp: 4299, discount_pct: 0, occasion: "Casual · Festive", region_origin: "Srikalahasti AP", badge: "—", in_stock: true, sizes_available: ["Free Size (5.5m)"], colours: ["Earthy Brown", "Blue"] },
        { product_id: "VC-W-011", name: "Rajasthani Block Print Suit", category: "ethnic-set", fabric: "Cotton", price: 2199, mrp: 2199, discount_pct: 0, occasion: "Casual · Festive", region_origin: "Jaipur Rajasthan", badge: "—", in_stock: true, sizes_available: ["S", "M", "L", "XL"], colours: ["Indigo", "Red", "Mustard"] },
        { product_id: "VC-W-012", name: "Sangeet Lehenga (Fusion)", category: "lehenga", fabric: "Silk + Brocade", price: 9999, mrp: 13000, discount_pct: 23, occasion: "Sangeet · Cocktail", region_origin: "—", badge: "—", in_stock: true, sizes_available: ["XS", "S", "M", "L", "XL"], colours: ["Aqua", "Coral", "Purple"] }
    ],
    products_men: [
        { product_id: "VC-M-001", name: "Royal Gold-Work Sherwani Set", category: "sherwani", fabric: "Brocade + Silk", price: 18999, mrp: 25000, discount_pct: 24, occasion: "Wedding · Festive", region_origin: "Varanasi UP", badge: "Featured", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["Ivory", "Navy", "Maroon"] },
        { product_id: "VC-M-002", name: "Oxford Cotton Shirt", category: "shirt", fabric: "Cotton Oxford", price: 1899, mrp: 1899, discount_pct: 0, occasion: "Formal · Office", region_origin: "—", badge: "New", in_stock: true, sizes_available: ["XS", "S", "M", "L", "XL", "XXL"], colours: ["White", "Sky Blue", "Light Pink"] },
        { product_id: "VC-M-003", name: "Linen Mandarin Kurta", category: "kurta", fabric: "Linen", price: 1499, mrp: 1999, discount_pct: 25, occasion: "Casual · Festive", region_origin: "—", badge: "Sale", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["Sage Green", "Beige", "White"] },
        { product_id: "VC-M-004", name: "Slim Fit Dark Jeans", category: "jeans", fabric: "Denim", price: 2299, mrp: 2299, discount_pct: 0, occasion: "Casual · Office", region_origin: "—", badge: "—", in_stock: true, sizes_available: ["28", "30", "32", "34", "36", "38"], colours: ["Indigo Dark", "Black"] },
        { product_id: "VC-M-005", name: "Heritage Tweed Blazer", category: "blazer", fabric: "Tweed", price: 7999, mrp: 7999, discount_pct: 0, occasion: "Formal · Party", region_origin: "—", badge: "Premium", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["Grey", "Brown"] },
        { product_id: "VC-M-006", name: "Brocade Nehru Jacket", category: "ethnic-wear", fabric: "Brocade", price: 3499, mrp: 3499, discount_pct: 0, occasion: "Festive · Wedding", region_origin: "—", badge: "Hot", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["Black Gold", "Wine Red", "Royal Blue"] },
        { product_id: "VC-M-007", name: "Linen Dhoti Pants", category: "ethnic-wear", fabric: "Linen", price: 2699, mrp: 2699, discount_pct: 0, occasion: "Ethnic Fusion · Casual", region_origin: "—", badge: "New", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["Off White", "Beige", "Olive"] },
        { product_id: "VC-M-008", name: "Bandhgala Suit Set", category: "sherwani", fabric: "Velvet", price: 11999, mrp: 16000, discount_pct: 25, occasion: "Wedding · Sangeet", region_origin: "—", badge: "—", in_stock: true, sizes_available: ["S", "M", "L", "XL"], colours: ["Teal", "Maroon", "Black"] },
        { product_id: "VC-M-009", name: "Cotton Kurta Pyjama Set", category: "kurta", fabric: "Cotton", price: 1799, mrp: 1799, discount_pct: 0, occasion: "Casual · Festive", region_origin: "—", badge: "—", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["White", "Beige", "Light Blue"] },
        { product_id: "VC-M-010", name: "Embroidered Wedding Kurta", category: "kurta", fabric: "Silk Blend", price: 4999, mrp: 6500, discount_pct: 23, occasion: "Wedding · Festive", region_origin: "—", badge: "—", in_stock: true, sizes_available: ["S", "M", "L", "XL", "XXL"], colours: ["Cream", "Gold", "Blue"] }
    ],
    ethnic_heritage: [
        { product_id: "ETH-001", heritage_name: "Banarasi Silks", region: "Varanasi, Uttar Pradesh", craft_type: "Handloom Silk Weaving", description_for_vaani: "Hand-woven by master weavers on traditional pit looms. Zari threads are real metallic — they glow under wedding lighting. Each saree takes 15–30 days to weave.", authenticity_note: "GI Tagged. Comes with handloom certificate.", price_range: "₹5,000 – ₹25,000" },
        { product_id: "ETH-002", heritage_name: "Rajasthani Block Prints", region: "Jaipur, Rajasthan", craft_type: "Hand Block Printing", description_for_vaani: "Natural dyes stamped onto cotton using carved wooden blocks. Each print is unique — slight variations are a sign of authenticity, not defect.", authenticity_note: "Hand-crafted by Chhipa artisan families.", price_range: "₹1,200 – ₹6,000" },
        { product_id: "ETH-003", heritage_name: "Chikankari", region: "Lucknow, Uttar Pradesh", craft_type: "Hand Embroidery on Muslin/Cotton", description_for_vaani: "Delicate shadow-work embroidery done by needle on sheer fabric. A single Chikankari kurta involves 2–3 artisans and 3–10 days of work.", authenticity_note: "Verified Lucknow Chikankari — not machine embroidered.", price_range: "₹1,800 – ₹9,000" },
        { product_id: "ETH-004", heritage_name: "Kalamkari Art", region: "Srikalahasti, Andhra Pradesh", craft_type: "Hand-painted / Block Printed Cotton", description_for_vaani: "Mythological and floral motifs drawn by hand using a bamboo pen (kalam) dipped in natural dyes. Completely chemical-free process.", authenticity_note: "Natural dyes only — tamarind, pomegranate, indigo.", price_range: "₹2,000 – ₹8,000" },
        { product_id: "ETH-005", heritage_name: "Kanjivaram Silk", region: "Kanchipuram, Tamil Nadu", craft_type: "Handloom Silk with Zari", description_for_vaani: "Temple border designs in contrast colours. Real Kanjivaram is woven with mulberry silk and real gold/silver zari. Heavier than regular silk.", authenticity_note: "GI Tagged Kanchipuram Silk. Weight > 600 grams.", price_range: "₹4,500 – ₹35,000" }
    ],
    size_chart_women: [
        { size_label: "XS", bust_cm: "76–80", waist_cm: "60–64", hip_cm: "84–88", fits_saree_blouse: "30–32\"", fits_kurta: "XS", fits_lehenga_choli: "22–24 waist" },
        { size_label: "S", bust_cm: "80–84", waist_cm: "64–68", hip_cm: "88–92", fits_saree_blouse: "32–34\"", fits_kurta: "S", fits_lehenga_choli: "24–26 waist" },
        { size_label: "M", bust_cm: "84–88", waist_cm: "68–72", hip_cm: "92–96", fits_saree_blouse: "34–36\"", fits_kurta: "M", fits_lehenga_choli: "26–28 waist" },
        { size_label: "L", bust_cm: "88–94", waist_cm: "72–78", hip_cm: "96–102", fits_saree_blouse: "36–38\"", fits_kurta: "L", fits_lehenga_choli: "28–30 waist" },
        { size_label: "XL", bust_cm: "94–100", waist_cm: "78–84", hip_cm: "102–108", fits_saree_blouse: "38–40\"", fits_kurta: "XL", fits_lehenga_choli: "30–32 waist" },
        { size_label: "XXL", bust_cm: "100–108", waist_cm: "84–90", hip_cm: "108–116", fits_saree_blouse: "40–42\"", fits_kurta: "XXL", fits_lehenga_choli: "32–34 waist" }
    ],
    size_chart_men: [
        { size_label: "S", chest_cm: "86–90", shoulder_cm: "40–42", kurta_length_cm: "42\"", shirt_size_equivalent: "S / 38", height_range: "5'4\"–5'7\"" },
        { size_label: "M", chest_cm: "90–96", shoulder_cm: "42–44", kurta_length_cm: "44\"", shirt_size_equivalent: "M / 40", height_range: "5'7\"–5'10\"" },
        { size_label: "L", chest_cm: "96–102", shoulder_cm: "44–46", kurta_length_cm: "46\"", shirt_size_equivalent: "L / 42", height_range: "5'9\"–6'0\"" },
        { size_label: "XL", chest_cm: "102–108", shoulder_cm: "46–48", kurta_length_cm: "48\"", shirt_size_equivalent: "XL / 44", height_range: "5'11\"–6'2\"" },
        { size_label: "XXL", chest_cm: "108–116", shoulder_cm: "48–50", kurta_length_cm: "50\"", shirt_size_equivalent: "XXL / 46", height_range: "6'0\"–6'3\"" }
    ],
    size_chart_jeans: [
        { waist_size: 28, waist_inches: "28\"", waist_cm: 71, hip_cm: 88, inseam_cm: 76 },
        { waist_size: 30, waist_inches: "30\"", waist_cm: 76, hip_cm: 92, inseam_cm: 78 },
        { waist_size: 32, waist_inches: "32\"", waist_cm: 81, hip_cm: 97, inseam_cm: 79 },
        { waist_size: 34, waist_inches: "34\"", waist_cm: 86, hip_cm: 102, inseam_cm: 79 },
        { waist_size: 36, waist_inches: "36\"", waist_cm: 91, hip_cm: 107, inseam_cm: 80 },
        { waist_size: 38, waist_inches: "38\"", waist_cm: 97, hip_cm: 112, inseam_cm: 80 }
    ],
    orders: [
        { order_id: "VC-20245781", customer_name: "Ananya Sharma", phone_last4: "8967", email: "ananya@email.com", product_id: "VC-M-003", product_name: "Linen Mandarin Kurta", size: "M", colour: "Sage Green", qty: 1, price: 1499, payment_method: "UPI", order_date: "2025-06-18", status: "Out for Delivery", courier: "Delhivery", tracking_id: "DL4872993", est_delivery: "2025-06-25" },
        { order_id: "VC-20245611", customer_name: "Priya Mehta", phone_last4: "4423", email: "priya@email.com", product_id: "VC-W-002", product_name: "Embroidered Bridal Lehenga", size: "M", colour: "Magenta", qty: 1, price: 14999, payment_method: "Razorpay Card", order_date: "2025-06-10", status: "Delivered", courier: "BlueDart", tracking_id: "BD9921334", est_delivery: "2025-06-15" },
        { order_id: "VC-20245900", customer_name: "Ramesh Kumar", phone_last4: "7812", email: "ramesh@email.com", product_id: "VC-M-001", product_name: "Royal Gold-Work Sherwani Set", size: "L", colour: "Ivory", qty: 1, price: 18999, payment_method: "COD", order_date: "2025-06-20", status: "Packed", courier: "DTDC", tracking_id: "Pending", est_delivery: "2025-06-28" },
        { order_id: "VC-20245233", customer_name: "Meena Iyer", phone_last4: "3301", email: "meena@email.com", product_id: "VC-W-001", product_name: "Banarasi Silk Zari Saree", size: "Free Size", colour: "Royal Blue", qty: 1, price: 8499, payment_method: "UPI", order_date: "2025-06-05", status: "Delivered", courier: "Ekart", tracking_id: "EK7723891", est_delivery: "2025-06-10" },
        { order_id: "VC-20246012", customer_name: "Vikram Nair", phone_last4: "5590", email: "vikram@email.com", product_id: "VC-M-006", product_name: "Brocade Nehru Jacket", size: "L", colour: "Black Gold", qty: 1, price: 3499, payment_method: "Visa", order_date: "2025-06-22", status: "Confirmed", courier: "—", tracking_id: "—", est_delivery: "2025-06-30" },
        { order_id: "VC-20246199", customer_name: "Sunita Das", phone_last4: "6678", email: "sunita@email.com", product_id: "VC-W-007", product_name: "Printed Palazzo Set", size: "L", colour: "Floral Pink", qty: 2, price: 3798, payment_method: "COD", order_date: "2025-06-23", status: "Processing", courier: "—", tracking_id: "—", est_delivery: "2025-07-01" },
        { order_id: "VC-20244890", customer_name: "Rohit Gupta", phone_last4: "2245", email: "rohit@email.com", product_id: "VC-M-004", product_name: "Slim Fit Dark Jeans", size: "32", colour: "Indigo Dark", qty: 1, price: 2299, payment_method: "RuPay", order_date: "2025-05-28", status: "Delivered", courier: "Xpressbees", tracking_id: "XB3312780", est_delivery: "2025-06-02" }
    ],
    order_status_log: [
        { status: "Confirmed", vaani_says: "Your order is confirmed and being prepared for dispatch! 🎉" },
        { status: "Packed", vaani_says: "Your order is packed and ready — awaiting courier pickup." },
        { status: "Shipped", vaani_says: "Your order is on its way! Here's your tracking link." },
        { status: "Out for Delivery", vaani_says: "Great news — your order will be delivered today! 🚚" },
        { status: "Delivered", vaani_says: "Your order was delivered on [date]. Hope you love it! 😊" },
        { status: "Delayed", vaani_says: "I see your order is running a bit late — I sincerely apologise. 😔" }
    ],
    courier_partners: [
        { courier_name: "Delhivery", tracking_url: "https://www.delhivery.com/track/package/{tracking_id}", coverage: "Pan India", avg_delivery_days: "3–5 days", cod_available: "Yes" },
        { courier_name: "BlueDart", tracking_url: "https://www.bluedart.com/tracking?trackid={tracking_id}", coverage: "Metro + Tier 1", avg_delivery_days: "2–3 days", cod_available: "Yes" },
        { courier_name: "Ekart", tracking_url: "https://ekartlogistics.com/tracking/{tracking_id}", coverage: "Pan India", avg_delivery_days: "4–6 days", cod_available: "Yes" },
        { courier_name: "DTDC", tracking_url: "https://www.dtdc.in/tracking/{tracking_id}", coverage: "Pan India", avg_delivery_days: "4–7 days", cod_available: "Yes" },
        { courier_name: "Xpressbees", tracking_url: "https://www.xpressbees.com/shipment/tracking?awb={tracking_id}", coverage: "Pan India", avg_delivery_days: "3–5 days", cod_available: "Yes" }
    ],
    return_tickets: [
        { return_id: "RT-20248823", order_id: "VC-20245611", reason_code: "COLOUR_DIFF", return_type: "refund", status: "Pickup Scheduled", pickup_date: "2025-06-27", refund_amount: 14999, refund_method: "Original Payment Method", resolved_at: "—" },
        { return_id: "RT-20248100", order_id: "VC-20244890", reason_code: "SIZE_ISSUE", return_type: "exchange", status: "Completed", pickup_date: "2025-06-10", refund_amount: "—", refund_method: "Exchange (size 34)", resolved_at: "2025-06-18" },
        { return_id: "RT-20247590", order_id: "VC-20245233", reason_code: "QUALITY", return_type: "refund", status: "Refund Credited", pickup_date: "2025-06-12", refund_amount: 8499, refund_method: "Bank Account", resolved_at: "2025-06-19" }
    ],
    return_policy_rules: [
        { rule_id: "RP-001", rule_name: "Return window", rule_value: "30 days from delivery date", applies_to: "All eligible items" },
        { rule_id: "RP-002", rule_name: "Item condition", rule_value: "Unused, unwashed, unworn", applies_to: "All returns" },
        { rule_id: "RP-003", rule_name: "Tags condition", rule_value: "Original tags must be intact and attached", applies_to: "All returns" },
        { rule_id: "RP-004", rule_name: "Packaging", rule_value: "Original packaging must be available", applies_to: "All returns" },
        { rule_id: "RP-005", rule_name: "Non-returnable: stitched blouses", rule_value: "Cannot be returned (hygiene)", applies_to: "Blouses ordered stitched" },
        { rule_id: "RP-006", rule_name: "Non-returnable: final sale items", rule_value: "Items marked \"Final Sale\"", applies_to: "Sale items" },
        { rule_id: "RP-007", rule_name: "Non-returnable: customised items", rule_value: "Personalised / custom-stitched garments", applies_to: "Custom orders" },
        { rule_id: "RP-008", rule_name: "Non-returnable: innerwear", rule_value: "Hygiene policy", applies_to: "Innerwear category" },
        { rule_id: "RP-009", rule_name: "Quality defect exception", rule_value: "Quality defects accepted beyond 30 days", applies_to: "Defective items only" },
        { rule_id: "RP-010", rule_name: "Exchange", rule_value: "Size/colour exchange allowed within 30 days if replacement in stock", applies_to: "Eligible items" },
        { rule_id: "RP-011", rule_name: "Pickup", rule_value: "Scheduled within 2–3 business days of approval", applies_to: "All returns" },
        { rule_id: "RP-012", rule_name: "Refund timeline", rule_value: "5–7 business days after pickup confirmation", applies_to: "Original payment method" },
        { rule_id: "RP-013", rule_name: "Store credit option", rule_value: "Available as faster alternative (2 business days)", applies_to: "Customer's choice" }
    ],
    return_reasons: [
        { reason_code: "COLOUR_DIFF", reason_label: "Colour different from photos", flags_qc: true, vaani_empathy_script: "I'm really sorry — colour representation on screens can differ. You absolutely deserve what you expected." },
        { reason_code: "SIZE_ISSUE", reason_label: "Size doesn't fit", flags_qc: false, vaani_empathy_script: "Sizing can be tricky online — no worries, let's get you the right size." },
        { reason_code: "QUALITY", reason_label: "Quality not as expected", flags_qc: true, vaani_empathy_script: "That's very disappointing and I want to make it right immediately." },
        { reason_code: "DAMAGED", reason_label: "Item arrived damaged", flags_qc: true, vaani_empathy_script: "I sincerely apologise — this should never happen. I'll prioritise your case." },
        { reason_code: "WRONG_ITEM", reason_label: "Wrong product delivered", flags_qc: true, vaani_empathy_script: "I'm so sorry about this error — we'll fix it as a priority." },
        { reason_code: "CHANGED_MIND", reason_label: "Changed mind", flags_qc: false, vaani_empathy_script: "Of course! You have 30 days to decide." },
        { reason_code: "LATE_DELIVERY", reason_label: "Order arrived too late for occasion", flags_qc: false, vaani_empathy_script: "I understand — that must be so frustrating. Let's sort this out." },
        { reason_code: "DUPLICATE", reason_label: "Ordered by mistake / duplicate", flags_qc: false, vaani_empathy_script: "No problem at all — let's get that sorted." }
    ],
    promotions: [
        { promo_id: "PROMO-001", code: "VASUDHA15", title: "15% Off on Sarees", discount_type: "percentage", discount_value: 15, min_order: 1500, max_discount: 5000, valid_from: "2025-06-01", valid_till: "2025-06-30", applicable_categories: "saree", stackable: false, usage_limit_per_user: 1 },
        { promo_id: "PROMO-002", code: "FIRSTLOOK", title: "First Order Discount", discount_type: "percentage", discount_value: 10, min_order: 0, max_discount: 2000, valid_from: "2025-01-01", valid_till: "2025-12-31", applicable_categories: "all", stackable: false, usage_limit_per_user: 1 },
        { promo_id: "PROMO-003", code: "FESTIVE500", title: "₹500 Off on ₹3999+", discount_type: "flat", discount_value: 500, min_order: 3999, max_discount: 500, valid_from: "2025-06-01", valid_till: "2025-07-15", applicable_categories: "all", stackable: false, usage_limit_per_user: 2 },
        { promo_id: "PROMO-004", code: "ETHNIC20", title: "20% Off Ethnic Wear", discount_type: "percentage", discount_value: 20, min_order: 2000, max_discount: 3000, valid_from: "2025-06-15", valid_till: "2025-07-31", applicable_categories: "ethnic-wear · kurta · sherwani", stackable: false, usage_limit_per_user: 1 },
        { promo_id: "PROMO-005", code: "NEWSEASON", title: "New Season Extra 12%", discount_type: "percentage", discount_value: 12, min_order: 1000, max_discount: 2500, valid_from: "2025-06-20", valid_till: "2025-07-20", applicable_categories: "all", stackable: false, usage_limit_per_user: 1 }
    ],
    shipping_policy: [
        { policy_id: "SHIP-001", policy_name: "Free Delivery Threshold", rule: "Free on all orders above ₹999", exceptions: "None" },
        { policy_id: "SHIP-002", policy_name: "Delivery Charge Below Threshold", rule: "₹49 flat for orders below ₹999", exceptions: "—" },
        { policy_id: "SHIP-003", policy_name: "Express Delivery", rule: "Available at ₹99 extra · 1–2 business days", exceptions: "Metro cities only" },
        { policy_id: "SHIP-004", policy_name: "COD Availability", rule: "Available Pan India", exceptions: "Extra ₹30 COD handling charge" },
        { policy_id: "SHIP-005", policy_name: "Standard Delivery Timeline", rule: "3–5 business days (metro) · 5–7 days (non-metro) · 7–10 days (remote)", exceptions: "Customised / ethnic items: +2 days" },
        { policy_id: "SHIP-006", policy_name: "International Shipping", rule: "Not available in Phase 1", exceptions: "—" },
        { policy_id: "SHIP-007", policy_name: "Address Change", rule: "Can be changed before dispatch only", exceptions: "Call support within 2 hours of ordering" },
        { policy_id: "SHIP-008", policy_name: "PO Box Delivery", rule: "Not available", exceptions: "Use residential/office address" }
    ],
    delivery_zones: [
        { city_tier: "Metro", examples: "Mumbai · Delhi · Bangalore · Chennai · Kolkata · Hyderabad", delivery_days: "2–4 days", express_available: "Yes", cod_available: "Yes" },
        { city_tier: "Tier 1", examples: "Pune · Ahmedabad · Jaipur · Lucknow · Surat · Kochi", delivery_days: "3–5 days", express_available: "Yes", cod_available: "Yes" },
        { city_tier: "Tier 2", examples: "Varanasi · Coimbatore · Visakhapatnam · Nagpur · Bhubaneswar", delivery_days: "4–6 days", express_available: "Limited", cod_available: "Yes" },
        { city_tier: "Tier 3 / Rural", examples: "Remote PIN codes", delivery_days: "7–10 days", express_available: "No", cod_available: "Limited" }
    ],
    payment_methods: [
        { payment_id: "PAY-001", method: "UPI", method_name: "UPI (GPay · PhonePe · Paytm · BHIM)", processing_time: "Instant", surcharge: "None", popular_for: "All customers", notes: "Most popular in India" },
        { payment_id: "PAY-002", method: "VISA", method_name: "Visa Credit / Debit Card", processing_time: "Instant", surcharge: "None", popular_for: "Urban shoppers", notes: "3D Secure enabled" },
        { payment_id: "PAY-003", method: "MASTERCARD", method_name: "Mastercard Credit / Debit Card", processing_time: "Instant", surcharge: "None", popular_for: "Urban shoppers", notes: "3D Secure enabled" },
        { payment_id: "PAY-004", method: "RUPAY", method_name: "RuPay Debit Card", processing_time: "Instant", surcharge: "None", popular_for: "Tier 2/3 customers", notes: "—" },
        { payment_id: "PAY-005", method: "COD", method_name: "Cash on Delivery", processing_time: "At delivery", surcharge: "₹30", popular_for: "First-time buyers · Tier 2/3", notes: "Not available for orders > ₹15,000" },
        { payment_id: "PAY-006", method: "NETBANKING", method_name: "Net Banking (All major banks)", processing_time: "Instant", surcharge: "None", popular_for: "Traditional buyers", notes: "—" },
        { payment_id: "PAY-007", method: "EMI", method_name: "Credit Card EMI (3/6/9/12 months)", processing_time: "Instant", surcharge: "Bank interest rates", popular_for: "Premium orders > ₹5000", notes: "Available on HDFC · ICICI · Axis · SBI cards" },
        { payment_id: "PAY-008", method: "WALLETS", method_name: "Paytm Wallet · Mobikwik", processing_time: "Instant", surcharge: "None", popular_for: "—", notes: "—" }
    ],
    faq_responses: [
        { faq_id: "FAQ-001", question: "How long does delivery take?", category: "Shipping", vaani_answer: "Standard delivery takes 3–5 business days for metro cities and 5–7 days for other areas. Express delivery (1–2 days) is available in metro cities for ₹99 extra.", follow_up_action: "Offer tracking link" },
        { faq_id: "FAQ-002", question: "Is there free shipping?", category: "Shipping", vaani_answer: "Yes! All orders above ₹999 ship free. Orders below ₹999 have a flat ₹49 shipping fee.", follow_up_action: "Suggest adding to cart" },
        { faq_id: "FAQ-003", question: "Do you deliver to [city]?", category: "Shipping", vaani_answer: "We deliver Pan India! Just enter your PIN code at checkout to confirm availability and estimated delivery date.", follow_up_action: "None" },
        { faq_id: "FAQ-004", question: "What is your return policy?", category: "Returns", vaani_answer: "You can return most items within 30 days of delivery — as long as they're unused, unwashed, with original tags and packaging. Some items like stitched blouses and customised pieces are non-returnable.", follow_up_action: "Offer to initiate return" },
        { faq_id: "FAQ-005", question: "How long does a refund take?", category: "Refunds", vaani_answer: "Refunds are processed within 5–7 business days of us receiving the returned item. If you prefer store credit, it's even faster — just 2 business days!", follow_up_action: "None" },
        { faq_id: "FAQ-006", question: "Can I exchange for a different size?", category: "Exchange", vaani_answer: "Yes! Exchanges for a different size or colour are accepted within 30 days, subject to stock availability.", follow_up_action: "Initiate exchange flow" },
        { faq_id: "FAQ-007", question: "Do you accept COD?", category: "Payment", vaani_answer: "Yes — COD is available across India for orders up to ₹15,000. A small ₹30 handling fee applies.", follow_up_action: "None" },
        { faq_id: "FAQ-008", question: "Is EMI available?", category: "Payment", vaani_answer: "Yes! EMI is available on HDFC, ICICI, Axis, and SBI credit cards for orders above ₹5,000. Select at checkout.", follow_up_action: "None" },
        { faq_id: "FAQ-009", question: "Are your handloom products authentic?", category: "Authenticity", vaani_answer: "Absolutely. Our handloom products are sourced directly from certified artisan clusters — Banarasi and Kanjivaram silks carry GI tags, and we share artisan provenance for every ethnic product.", follow_up_action: "Share ETH record" },
        { faq_id: "FAQ-010", question: "What is the difference between Banarasi and Kanjivaram silk?", category: "Product Knowledge", vaani_answer: "Both are handwoven with real silk and zari! Banarasi silk from Varanasi features intricate Mughal-inspired motifs and feels lighter. Kanjivaram from Kanchipuram has contrasting temple borders and is heavier — ideal for South Indian wedding traditions.", follow_up_action: "Offer product recs" }
    ],
    fabric_care: [
        { fabric_id: "FAB-001", fabric_name: "Pure Silk (Banarasi · Kanjivaram)", wash_method: "Dry clean only", water_temp: "Cold if hand-washing", drying: "Dry in shade · Never tumble dry", ironing: "Low heat · Use cloth between iron and fabric", storage: "Wrap in muslin cloth · Not plastic · Re-fold every 6 months", special_notes: "Avoid perfume/deodorant contact on zari · Wipe zari gently if tarnished" },
        { fabric_id: "FAB-002", fabric_name: "Cotton (Chikankari · Kalamkari · Block Print)", wash_method: "Hand wash or gentle machine wash", water_temp: "Cold (30°C max)", drying: "Dry in shade", ironing: "Medium heat", storage: "Fold flat · Store in cotton bag", special_notes: "First wash colours may bleed slightly — wash alone" },
        { fabric_id: "FAB-003", fabric_name: "Georgette", wash_method: "Dry clean preferred · Hand wash gentle", water_temp: "Cold", drying: "Hang to dry · Not tumble", ironing: "Low heat", storage: "Hang in wardrobe · Not folded", special_notes: "Very delicate — avoid wringing" },
        { fabric_id: "FAB-004", fabric_name: "Chiffon", wash_method: "Hand wash only", water_temp: "Cold", drying: "Hang to dry", ironing: "Very low heat with pressing cloth", storage: "Hang · Never fold tightly", special_notes: "Snags easily — wash inside out" }
    ],
    occasion_guide: [
        { occasion: "Wedding (Guest)", women_recommendations: "Banarasi/Kanjivaram Saree · Embroidered Lehenga · Anarkali Suit", men_recommendations: "Sherwani Set · Brocade Kurta with Churidar", vaani_opening_line: "Weddings call for something truly special! Here's what we'd recommend..." },
        { occasion: "Bridal", women_recommendations: "Embroidered Bridal Lehenga · Heavy Silk Saree", men_recommendations: "Royal Gold-Work Sherwani (Groom) · Bandhgala Suit", vaani_opening_line: "Congratulations! Let me help you find your perfect bridal look." },
        { occasion: "Sangeet", women_recommendations: "Fusion Lehenga · Embroidered Anarkali", men_recommendations: "Brocade Nehru Jacket · Printed Kurta", vaani_opening_line: "Sangeet outfits are so fun — colourful and a little dramatic! Here are some favourites." },
        { occasion: "Festive (Diwali · Holi · Eid)", women_recommendations: "Chikankari Kurta Set · Printed Saree · Chanderi Saree", men_recommendations: "Linen Kurta · Nehru Jacket · Ethnic Set", vaani_opening_line: "Nothing like dressing up for a festival! Here are some perfect picks." }
    ],
    support_schedule: [
        { day: "Monday – Saturday", shift: "Day", hours_ist: "9:00 AM – 9:00 PM IST", channels: "Chat (Vaani hand-off) · Email · WhatsApp", avg_response_time: "Within 2–4 hours" },
        { day: "Sunday", shift: "Closed", hours_ist: "—", channels: "Email only", avg_response_time: "Next business day" },
        { day: "Peak Season (Diwali · Wedding Season)", shift: "Extended", hours_ist: "8:00 AM – 11:00 PM IST", channels: "All channels", avg_response_time: "Within 1–2 hours" }
    ],
    escalation_triggers: [
        { trigger_type: "Explicit request", condition: "User says \"talk to human\" · \"manager\" · \"agent\"", vaani_action: "Immediately initiate escalation flow" },
        { trigger_type: "Repeated failure", condition: "Same issue unresolved after 2 Vaani turns", vaani_action: "Proactively offer escalation" },
        { trigger_type: "Low confidence", condition: "Intent confidence < 0.50 on sensitive query", vaani_action: "Offer escalation or clarification" },
        { trigger_type: "High frustration", condition: "Sentiment analysis: negative + urgent", vaani_action: "Empathise and offer escalation" },
        { trigger_type: "High-value complaint", condition: "Order value > ₹10,000 + complaint intent", vaani_action: "Auto-elevate to HIGH priority" },
        { trigger_type: "Defective product", condition: "Reason code DAMAGED or WRONG_ITEM", vaani_action: "Auto-create priority ticket" }
    ],
    site_section_context: [
        { anchor_id: "#women", section_name: "Women's Finest", vaani_context_greeting: "I see you're exploring our Women's collection! Can I help you find something specific?", products_to_reference: "VC-W-001 to VC-W-012" },
        { anchor_id: "#men", section_name: "Men's Signatures", vaani_context_greeting: "Great taste — you're browsing our Men's Signatures! Looking for something particular?", products_to_reference: "VC-M-001 to VC-M-010" },
        { anchor_id: "#ethnic", section_name: "Ethnic Spotlight", vaani_context_greeting: "You're exploring our Heritage Collections — each piece here has an incredible story. What region or craft are you drawn to?", products_to_reference: "ETH-001 to ETH-005" },
        { anchor_id: "#trending", section_name: "Trending Now", vaani_context_greeting: "These are our most-loved styles right now! See anything that caught your eye?", products_to_reference: "VC-W-006 · VC-W-007 · VC-M-006 · VC-M-007" },
        { anchor_id: "#lookbook", section_name: "Season Lookbook", vaani_context_greeting: "You're browsing the Lookbook! Which look resonates with you — the Festive Saree Edit, the Groom's Story, or Sangeet Night?", products_to_reference: "Curated sets" },
        { anchor_id: "/", section_name: "Homepage", vaani_context_greeting: "Namaste! 🙏 I'm Vaani — welcome to Vasudha Couture. Where Tradition Meets Modern Elegance.", products_to_reference: "General" }
    ]
};

// Modular writing
const modules = {
    'catalog.json': { categories: db.categories, products_women: db.products_women, products_men: db.products_men, ethnic_heritage: db.ethnic_heritage },
    'size_charts.json': { size_chart_women: db.size_chart_women, size_chart_men: db.size_chart_men, size_chart_jeans: db.size_chart_jeans },
    'orders.json': { orders: db.orders, order_status_log: db.order_status_log, courier_partners: db.courier_partners },
    'returns.json': { return_tickets: db.return_tickets, return_policy_rules: db.return_policy_rules, return_reasons: db.return_reasons },
    'promotions.json': { promotions: db.promotions },
    'shipping.json': { shipping_policy: db.shipping_policy, delivery_zones: db.delivery_zones },
    'payments.json': { payment_methods: db.payment_methods },
    'faqs.json': { faq_responses: db.faq_responses },
    'fabric_care.json': { fabric_care: db.fabric_care },
    'occasion_guide.json': { occasion_guide: db.occasion_guide },
    'support.json': { support_schedule: db.support_schedule, escalation_triggers: db.escalation_triggers, site_section_context: db.site_section_context }
};

for (const [filename, data] of Object.entries(modules)) {
    fs.writeFileSync(path.join(modulesDir, filename), JSON.stringify(data, null, 2));
    console.log(`Created ${filename}`);
}

console.log("Mock DB generation complete!");
