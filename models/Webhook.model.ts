import mongoose, { Document, Schema } from 'mongoose';

interface IWebhook extends Document {
  url: string;
}

const WebhookSchema: Schema = new Schema({
  url: { type: String, required: true, unique: true },
});

const Webhook = mongoose.model<IWebhook>('Webhook', WebhookSchema);
export default Webhook;
