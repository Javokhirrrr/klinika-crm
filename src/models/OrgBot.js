import mongoose from "mongoose";

const OrgBotSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },

    botToken: { type: String, required: true }, // BE’ga saqlanadi, UI ga qaytmaydi
    username: { type: String, default: "" },    // @username
    name:     { type: String, default: "" },    // bot first_name (ixtiyoriy)

    isActive: { type: Boolean, default: true },

    webhookSecret: { type: String, required: true },
    webhookUrl:    { type: String, default: "" },
  },
  { timestamps: true }
);

OrgBotSchema.index({ orgId: 1, createdAt: -1 });

export const OrgBot = mongoose.model("OrgBot", OrgBotSchema);
