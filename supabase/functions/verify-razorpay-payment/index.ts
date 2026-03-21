import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { corsHeaders } from '../_shared/cors.ts'

// For Crypto HMAC operations in Deno
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error("Missing Razorpay payment parameters")
    }

    // Initialize Supabase Client (Service Role for Admin DB privileges)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) throw new Error("Razorpay secret not configured")

    // 1. Verify Razorpay Signature (HMAC SHA256)
    // The signature formula: HMAC_SHA256(order_id + "|" + payment_id, keySecret)
    const expectedSignature = createHmac('sha256', keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error(`Signature mismatch! Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
      throw new Error("Invalid payment signature! Security Warning.");
    }

    // 2. Signature match confirmed. Payment is legitimate.
    // Fetch the original transaction to understand what we are fulfilling
    const { data: transaction, error: fetchErr } = await supabaseClient
      .from('razorpay_transactions')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .single()

    if (fetchErr || !transaction) {
      throw new Error("Could not locate original transaction order in the database")
    }

    if (transaction.status === 'paid') {
      return new Response(
        JSON.stringify({ success: true, message: "Payment already verified", receipt: transaction.receipt_number }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 3. Mark Razorpay Transaction as PAID
    const { data: updatedTx, error: updateErr } = await supabaseClient
      .from('razorpay_transactions')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', razorpay_order_id)
      .select()
      .single()

    if (updateErr) throw new Error("Failed to update transaction status")

    // 4. Handle specific business logic based on 'purpose'
    
    // A. EMI Repayment Flow
    if (transaction.purpose === 'emi_repayment' && transaction.contract_id) {
        // Find the earliest 'pending' repayment for this contract
        const { data: pendingRepayments } = await supabaseClient
            .from('emi_repayments')
            .select('id, emi_amount')
            .eq('contract_id', transaction.contract_id)
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(1)

        if (pendingRepayments && pendingRepayments.length > 0) {
            const repayment_id = pendingRepayments[0].id

            await supabaseClient
                .from('emi_repayments')
                .update({ 
                    status: 'paid', 
                    paid_on: new Date().toISOString(),
                    transaction_id: updatedTx.id 
                })
                .eq('id', repayment_id)
             
            // Send Notification
            await supabaseClient.from('notifications').insert({
                user_id: transaction.user_id,
                title: 'Payment Successful',
                content: `Your EMI payment of ₹${transaction.amount / 100} has been received successfully! Receipt ID: ${updatedTx.receipt_number}`,
                type: 'payment',
                is_read: false
            })
        }
    }
    
    // B. New Contract Checkout Flow (will be added here as needed)
    if (transaction.purpose === 'checkout') {
         // Future: Logic to create the new contract once checkout succeeds
         // For now, it just marks the razorpay_transaction as paid.
    }

    // 5. Success Finalization
    return new Response(
      JSON.stringify({ 
          success: true, 
          receipt_number: updatedTx.receipt_number,
          message: "Payment successfully verified and logged."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("Verification Error:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
