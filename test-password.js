const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'admin123';
  const hashedPassword = '$2a$10$M12MbiwU1MmcxAcPDD2XluyP4yIbFLqtp2MvFM9EGwU3piXOAz77C';
  
  // Test comparePassword
  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log('Password match:', isMatch);
}

testPassword();
