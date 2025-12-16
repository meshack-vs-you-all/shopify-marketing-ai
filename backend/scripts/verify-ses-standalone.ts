import { SESClient, GetSendQuotaCommand, SendEmailCommand } from "@aws-sdk/client-ses";
import * as dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
    console.error("Error: AWS credentials missing in environment variables.");
    process.exit(1);
}

console.log(`Configuring SES Client...`);
console.log(`Region: ${region}`);
console.log(`Access Key ID: ${accessKeyId ? accessKeyId.substring(0, 4) + "****" : "Missing"}`);

const client = new SESClient({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

async function verifySES() {
    try {
        console.log("1. Checking Send Quota...");
        const quota = await client.send(new GetSendQuotaCommand({}));
        console.log("   Success! Max24HourSend: ", quota.Max24HourSend);
        console.log("   SentLast24Hours: ", quota.SentLast24Hours);

        console.log("\n2. Attempting to send test email to simulator...");
        const sendRes = await client.send(new SendEmailCommand({
            Source: process.env.SES_FROM_EMAIL || "glowifystore333@gmail.com",
            Destination: {
                ToAddresses: ["lensaomondi8@gmail.com"]
            },
            Message: {
                Subject: { Data: "✨ Glowify Weekly: Trends You Can't Miss!" },
                Body: {
                    Html: {
                        Data: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #4A90E2;">Glowify Newsletter</h1>
                                <p>Hi there!</p>
                                <p>Welcome to this week's edition of the Glowify newsletter. Here are the top trends specifically curated for your store.</p>
                                <hr>
                                <h3>🚀 Trending Strategy</h3>
                                <p>AI-driven campaigns are seeing a <strong>200% ROI increase</strong> this month.</p>
                                <br>
                                <p style="font-size: 12px; color: #888;">Sent via Amazon SES | Glowify Marketing AI</p>
                            </div>
                        `
                    },
                    Text: { Data: "Welcome to Glowify Newsletter! AI-driven campaigns are huge this month." }
                }
            }
        }));
        console.log("   Success! MessageId:", sendRes.MessageId);
        console.log("\n[VERIFICATION SUCCESS] AWS SES integration is working.");

    } catch (error: any) {
        console.error("\n[VERIFICATION FAILED]");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.name === 'MessageRejected') {
            console.error("Note: If using Sandbox, verify the 'From' email address.");
        }
        process.exit(1);
    }
}

verifySES();
