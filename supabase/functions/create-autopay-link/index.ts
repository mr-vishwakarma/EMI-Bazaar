import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { corsHeaders } from '../_shared/cors.ts'

interface AutoPayRequest {
    contract_id: string;
    customer_phone: string;
    customer_name: string;
    amount: number; // For mandate setup, an initial token amount like 100 or actual EMI amount is typical
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { contract_id, customer_phone, customer_name, amount } = await req.json() as AutoPayRequest;

        if (!contract_id) throw new Error("Contract ID is required");

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        )

        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

        if (userError || !user) throw new Error("Unauthorized request")

        const keyId = Deno.env.get('RAZORPAY_KEY_ID');
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
        if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");

        const basicAuth = btoa(`${keyId}:${keySecret}`);
        
        // Ensure a valid amount for Razorpay Payment Link (minimum 100 paise = 1 INR)
        const amountInPaise = Math.max(100, Math.round(amount * 100));

        // Create a Standard Payment Link API request
        // Standard Links support UPI, Cards, Netbanking and capture Mandates if Account is allowed
        const response = await fetch('https://api.razorpay.com/v1/payment_links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${basicAuth}`
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: "INR",
                accept_partial: false,
                description: `Setup EMI AutoPay Mandate`,
                customer: {
                    name: customer_name || "Valued Customer",
                    contact: customer_phone ? (customer_phone.startsWith('+91') ? customer_phone : `+91${customer_phone}`) : undefined
                },
                notify: {
                    sms: false,
                    email: false
                },
                reminder_enable: false,
                notes: {
                    purpose: 'autopay_setup',
                    contract_id: contract_id
                }
            })
        });

        const rzpLink = await response.json();

        if (!response.ok) {
            console.error("Razorpay Error:", rzpLink);
            throw new Error(rzpLink.error?.description || "Failed to create Razorpay Payment Link");
        }

        // Store standard Razorpay Transaction locally to expect the Webhook or Realtime
        await supabaseClient.from('razorpay_transactions').insert({
            user_id: user.id, // the vendor requesting it
            contract_id: contract_id,
            order_id: rzpLink.id, // Payment link ID
            amount: amountInPaise,
            currency: "INR",
            purpose: 'autopay_setup',
            status: 'created'
        });

        return new Response(
            JSON.stringify({
                success: true,
                short_url: rzpLink.short_url,
                payment_link_id: rzpLink.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error("AutoPay Function Exception:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message || "Unknown error occurred" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
