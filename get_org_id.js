// get_org_id.js - Get organization ID for Akfa Medline
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm';

async function getOrgId() {
    try {
        await mongoose.connect(MONGO_URI);

        const Organization = mongoose.model('Organization', new mongoose.Schema({}, { strict: false, collection: 'organizations' }));

        // Find Akfa Medline (code: 150005)
        const org = await Organization.findOne({ code: '150005' });

        if (org) {
            console.log(org._id.toString());
        } else {
            // If not found, get first org
            const firstOrg = await Organization.findOne({});
            if (firstOrg) {
                console.log(firstOrg._id.toString());
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

getOrgId();
