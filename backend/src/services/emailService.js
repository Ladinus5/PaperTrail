const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendReceiptEmail = async ({
    to,
    customerName,
    receiptNumber,
    pdfBuffer,
    publicReceiptUrl,
}) => {
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,

        to: [to],

        subject: `Receipt ${receiptNumber}`,

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #222;
            ">

                <h2>Thank you for your purchase!</h2>

                <p>
                    Hello ${customerName || "Customer"},
                </p>

                <p>
                    Your receipt
                    <strong>${receiptNumber}</strong>
                    is ready.
                </p>

                <div style="margin: 30px 0;">
                    <a
                        href="${publicReceiptUrl}"
                        style="
                            display: inline-block;
                            background: #004AAD;
                            color: white;
                            text-decoration: none;
                            padding: 12px 20px;
                            border-radius: 6px;
                        "
                    >
                        View Receipt Online
                    </a>
                </div>

                <p>
                    Your receipt PDF is also attached to this email.
                </p>

                <p>
                    Thank you for your business.
                </p>

            </div>
        `,

        attachments: [
            {
                filename: `${receiptNumber}.pdf`,
                content: pdfBuffer,
            },
        ],
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

module.exports = {
    sendReceiptEmail,
};