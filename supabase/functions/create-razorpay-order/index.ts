import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { corsHeaders } from '../_shared/cors.ts'

// Define the incoming request shape
interface PaymentRequest {
  amount: number;       // Amount in RUPEES (e.g., 500)
  currency?: string;    // e.g., 'INR'
  purpose: string;      // 'checkout' | 'emi_repayment'
  contract_id?: string; // Optional if tied to a specific EMI contract
}

serve(async (req) => {
  // 1. Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'INR', purpose, contract_id } = await req.json() as PaymentRequest

    // Ensure amount is provided
    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required")
    }

    // 2. Initialize Supabase Client with Service Role (to insert into the DB securely)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verify the user making the request from authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error("Unauthorized request")
    }

    // 3. Prepare Razorpay API Credentials
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured on the server")
    }

    const basicAuth = btoa(`${keyId}:${keySecret}`)
    const amountInPaise = Math.round(amount * 100); // Razorpay requires paise

    // 4. Create the Razorpay Order via REST API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency,
        notes: {
          purpose,
          user_id: user.id,
          contract_id
        }
      })
    })

    const razorpayOrder = await response.json();

    if (!response.ok) {
      console.error("Razorpay Error:", razorpayOrder);
      throw new Error(razorpayOrder.error?.description || "Failed to create Razorpay order")
    }

    // 5. Insert transaction record into Supabase (status defaults to 'created')
    const { error: dbError } = await supabaseClient
      .from('razorpay_transactions')
      .insert({
        user_id: user.id,
        contract_id: contract_id || null,
        order_id: razorpayOrder.id,
        amount: amountInPaise,
        currency,
        purpose,
        status: 'created',
        metadata: {
          original_amount: amount
        }
      })

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      throw new Error("Order created but failed to save transaction internally: " + dbError.message)
    }

    // 6. Return the order details to the frontend
    return new Response(
      JSON.stringify({ 
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        currency: razorpayOrder.currency,
        key_id: keyId // Frontend needs the Key ID to initialize the widget
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
