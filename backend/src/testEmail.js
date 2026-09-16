require("dotenv").config();

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,

        to: ["anihlo2003@gmail.com"],

        subject: "Receipt Platform Test 🔥",

        html: `
            <h1>It works 🔥</h1>
            <p>Your receipt platform email system is connected to Resend.</p>
        `,
    });

    if (error) {
        console.error("EMAIL FAILED:");
        console.error(error);
        process.exit(1);
    }

    console.log("EMAIL SENT SUCCESSFULLY 🔥");
    console.log(data);
}

testEmail();