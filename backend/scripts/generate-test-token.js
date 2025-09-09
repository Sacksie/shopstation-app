const jwt = require('jsonwebtoken');
const { getStoreUserByEmail } = require('../database/db-operations'); 

const generateTestToken = async (email) => {
  if (!email) {
    console.error('Usage: node scripts/generate-test-token.js <email>');
    process.exit(1);
  }

  try {
    const user = await getStoreUserByEmail(email);

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      storeId: user.store_id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    console.log(token);
  } catch (error) {
    console.error('Error generating token:', error);
    process.exit(1);
  }
};

generateTestToken(process.argv[2]);
