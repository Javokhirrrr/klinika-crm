import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  console.log('--- Treatment Plan Model Test ---');
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/klinika_crm');
    const { User } = await import('../src/models/User.js');
    const { Patient } = await import('../src/models/Patient.js');
    const { Service } = await import('../src/models/Service.js');
    const { TreatmentPlan } = await import('../src/models/TreatmentPlan.js');

    const admin = await User.findOne({});
    const patient = await Patient.findOne({});
    const services = await Service.find({}).limit(2);

    if (!admin || !patient || services.length < 2) {
      console.log('Missing basic data for test');
      process.exit(0);
    }

    console.log('Creating Plan...');
    const plan = new TreatmentPlan({
      orgId: admin.orgId,
      patientId: patient._id,
      doctorId: admin._id,
      diagnosis: 'Test Backend Automation',
      items: [
        { serviceId: services[0]._id, name: services[0].name, price: 10000, quantity: 1, discount: 0 },
        { serviceId: services[1]._id, name: services[1].name, price: 50000, quantity: 2, discount: 5000 },
      ]
    });

    await plan.save();
    console.log('Created Plan ID:', plan._id.toString());
    console.log('Initial Progress:', plan.progress + '%');
    console.log('Total Cost:', plan.totalCost);

    if (plan.progress !== 0) throw new Error('Progress should be 0');
    if (plan.totalCost !== 105000) throw new Error(`Cost should be 105000, got ${plan.totalCost}`);

    // Update status
    plan.items[0].status = 'completed';
    await plan.save();
    
    console.log('Progress after 1 item:', plan.progress + '%');
    if (plan.progress !== 50) throw new Error(`Progress should be 50, got ${plan.progress}`);

    await TreatmentPlan.findByIdAndDelete(plan._id);
    console.log('Test Passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed ❌', err);
    process.exit(1);
  }
}
runTest();
