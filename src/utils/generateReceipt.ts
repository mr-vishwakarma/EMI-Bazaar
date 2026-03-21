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
