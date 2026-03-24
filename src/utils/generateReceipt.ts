export const downloadReceipt = (details: {
    receiptNumber: string;
    date: string;
    customerName: string;
    productName: string;
    amountPaid: number;
    paymentMethod: string;
    loanRemaining: number;
}) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt - ${details.receiptNumber}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; background: #f3f4f6; padding: 20px; display: flex; justify-content: center; }
            .receipt-container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); width: 100%; max-w: 600px; color: #1f2937; position: relative; overflow: hidden; }
            .receipt-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; background: linear-gradient(90deg, #0ea5e9, #38bdf8); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px dashed #e5e7eb; padding-bottom: 30px; }
            .logo { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #0ea5e9; margin: 0; }
            .tagline { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .receipt-title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; text-align: right; color: #f3f4f6; -webkit-text-stroke: 1px #d1d5db; position: relative; top: -5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .info-block span { display: block; font-size: 10px; color: #6b7280; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
            .info-block strong { font-size: 14px; color: #111827; }
            .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 40px; }
            .amount-box span { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            .amount-box h2 { font-size: 48px; font-weight: 800; color: #0ea5e9; margin: 10px 0 0; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .details-table th, .details-table td { padding: 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
            .details-table th { font-size: 10px; color: #6b7280; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
            .details-table td { font-weight: 600; color: #334155; }
            .details-table td:last-child, .details-table th:last-child { text-align: right; }
            .footer { border-top: 2px dashed #e5e7eb; padding-top: 30px; text-align: center; }
            .footer p { font-size: 12px; color: #64748b; margin: 0 0 10px; }
            .stamp { text-align: center; font-size: 10px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 2px; padding: 8px 16px; background: #ecfdf5; border-radius: 20px; display: inline-block; border: 1px dashed #34d399; }
            @media print {
                body { background: white; padding: 0; }
                .receipt-container { box-shadow: none; border: 1px solid #e5e7eb; }
                .header, .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .amount-box h2 { color: #000; }
            }
        </style>
    </head>
    <body onload="window.print(); setTimeout(() => window.close(), 500)">
        <div class="receipt-container">
            <div class="header">
                <div>
                    <h1 class="logo">EMI BAZAAR</h1>
                    <span class="tagline">Official Payment Receipt</span>
                </div>
                <div>
                    <h2 class="receipt-title">RECEIPT</h2>
                    <div class="info-block" style="text-align: right;">
                        <span style="font-size: 12px;">No.</span>
                        <strong style="font-family: monospace; font-size: 16px; color: #0ea5e9;">${details.receiptNumber}</strong>
                    </div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-block">
                    <span>Date Paid</span>
                    <strong>${details.date}</strong>
                </div>
                <div class="info-block">
                    <span>Paid By</span>
                    <strong>${details.customerName}</strong>
                </div>
                <div class="info-block">
                    <span>Payment Method</span>
                    <strong>${details.paymentMethod}</strong>
                </div>
                <div class="info-block">
                    <span>Status</span>
                    <strong style="color: #10b981;">✓ SUCCESS</strong>
                </div>
            </div>

            <div class="amount-box">
                <span>Total Amount Paid</span>
                <h2>₹${details.amountPaid.toLocaleString('en-IN')}</h2>
            </div>

            <table class="details-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            EMI Repayment<br>
                            <span style="font-size: 12px; color: #64748b; font-weight: 400;">Contract: ${details.productName}</span>
                        </td>
                        <td>₹${details.amountPaid.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                        <td style="padding-top: 20px; padding-bottom: 0;">
                            <span style="font-size: 12px; color: #6b7280; font-weight: 800; text-transform: uppercase;">Remaining Loan Balance</span>
                        </td>
                        <td style="padding-top: 20px; padding-bottom: 0;">
                            <strong>₹${details.loanRemaining.toLocaleString('en-IN')}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                <p>Thank you for choosing EMI Bazaar. This is a computer-generated receipt.</p>
                <div class="stamp">AUTHENTICATED DIGITAL RECEIPT</div>
            </div>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};

export const generateContractInvoice = (details: {
    contractId: string;
    date: string;
    customerName: string;
    customerPhone: string;
    productName: string;
    productPrice: number;
    downPayment: number;
    principalAmount: number;
    totalAmount: number;
    emiAmount: number;
    duration: string;
    nextDueDate: string;
}) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EMI Contract - ${details.contractId}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; background: #f3f4f6; margin: 0; padding: 20px; display: flex; justify-content: center; }
            .invoice-box { background: #fff; padding: 50px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 700px; color: #111827; position: relative; }
            .invoice-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 12px; background: #FF6B3D; border-radius: 20px 20px 0 0; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f3f4f6; padding-bottom: 30px; margin-bottom: 30px; }
            .brand { display: flex; flex-direction: column; }
            .brand h1 { margin: 0; font-size: 32px; font-weight: 900; color: #FF6B3D; letter-spacing: -1px; text-transform: uppercase; }
            .brand span { font-size: 11px; font-weight: 800; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { margin: 0; font-size: 28px; font-weight: 900; color: #f3f4f6; -webkit-text-stroke: 1px #d1d5db; letter-spacing: 2px; text-transform: uppercase; }
            .invoice-details p { margin: 5px 0 0; font-size: 14px; font-weight: 800; color: #111827; }
            .invoice-details span { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
            
            .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
            .info-block { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
            .info-block h3 { margin: 0 0 15px; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
            .info-item { margin-bottom: 10px; }
            .info-item:last-child { margin-bottom: 0; }
            .info-item p { margin: 0; font-size: 14px; font-weight: 600; color: #111827; }
            .info-item span { display: block; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
            
            .table-container { margin-bottom: 40px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { background: #f9fafb; padding: 16px 20px; font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; }
            td { padding: 16px 20px; font-size: 14px; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6; }
            td:last-child, th:last-child { text-align: right; }
            .summary-row td { background: #f9fafb; font-weight: 800; }
            
            .emi-highlight { background: #fff5f2; border: 2px dashed #FF6B3D; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 40px; position: relative; }
            .emi-highlight .badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #FF6B3D; color: #fff; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
            .emi-highlight p { margin: 0; font-size: 12px; font-weight: 800; color: #FF6B3D; text-transform: uppercase; letter-spacing: 1px; }
            .emi-highlight h2 { margin: 10px 0 5px; font-size: 48px; font-weight: 900; color: #111827; line-height: 1; }
            .emi-highlight span { font-size: 14px; color: #6b7280; font-weight: 600; }
            
            .terms { font-size: 10px; color: #9ca3af; line-height: 1.6; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-bottom: 30px; }
            .footer { text-align: center; }
            .footer p { font-size: 12px; font-weight: 800; color: #111827; margin: 0; }
            .footer span { font-size: 10px; color: #9ca3af; }
            
            @media print {
                body { background: white; padding: 0; }
                .invoice-box { box-shadow: none; border: none; padding: 0; }
                .emi-highlight { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .invoice-box::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style>
    </head>
    <body onload="window.print(); setTimeout(() => window.close(), 500)">
        <div class="invoice-box">
            <div class="header">
                <div class="brand">
                    <h1>EMI BAZAAR</h1>
                    <span>Official EMI Contract</span>
                </div>
                <div class="invoice-details">
                    <h2>INVOICE</h2>
                    <span>Contract No.</span>
                    <p>${details.contractId}</p>
                    <span style="display:block; margin-top:5px;">Date</span>
                    <p style="font-size:12px;">${details.date}</p>
                </div>
            </div>

            <div class="two-cols">
                <div class="info-block">
                    <h3>Customer Details</h3>
                    <div class="info-item">
                        <span>Name</span>
                        <p>${details.customerName}</p>
                    </div>
                    <div class="info-item">
                        <span>Phone</span>
                        <p>${details.customerPhone}</p>
                    </div>
                </div>
                <div class="info-block" style="background: #fff; border: 2px solid #e5e7eb;">
                    <h3>Product Details</h3>
                    <div class="info-item">
                        <span>Description</span>
                        <p style="font-size: 16px; font-weight: 800;">${details.productName}</p>
                    </div>
                    <div class="info-item">
                        <span>Sale Price</span>
                        <p>₹${details.productPrice.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Payment Breakdown</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                Down Payment
                                <span style="display:block; font-size:10px; color:#6b7280; font-weight:400; margin-top:2px;">Paid at time of purchase</span>
                            </td>
                            <td>₹${details.downPayment.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td>
                                Principal Amount
                                <span style="display:block; font-size:10px; color:#6b7280; font-weight:400; margin-top:2px;">Financed Loan Amount</span>
                            </td>
                            <td>₹${details.principalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr class="summary-row">
                            <td style="color: #FF6B3D;">Total Payable over EMI Tenure</td>
                            <td style="color: #FF6B3D; font-size: 18px;">₹${details.totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="emi-highlight">
                <div class="badge">EMI SCHEDULE</div>
                <p>EACH INSTALLMENT</p>
                <h2>₹${Math.ceil(details.emiAmount).toLocaleString('en-IN')}</h2>
                <span>For <strong>${details.duration}</strong>. Next Due: <strong>${details.nextDueDate}</strong></span>
            </div>

            <div class="terms">
                <strong>TERMS & CONDITIONS:</strong> This document serves as the official tax invoice and binding EMI contract. Goods once sold are subject to the vendor's return policy. EMI defaults may attract late fees or penalty charges as per the agreed schedule. For support, contact your seller directly or visit emibazaar.com.
            </div>

            <div class="footer">
                <p>Thank you for shopping with EMI Bazaar!</p>
                <span>Authorized Digital Signature</span>
            </div>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
};
