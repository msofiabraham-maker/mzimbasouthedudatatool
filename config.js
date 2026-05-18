// CONFIGURATION FILE
// ===================
// This file contains static configuration for the Mzimba South EduData Hub.
// All passwords and settings are stored here to ensure consistency across all devices and browsers.
// 
// IMPORTANT: To change passwords, modify the values below and redeploy the updated config.js file.
// All devices will use the same passwords after deployment.

const Config = {
    // District Access Password
    // Change this value to update the district password globally
    districtPassword: 'Zql7,c7$-4Fj;]h$',
    
    // Admin Credentials
    // Change these values to update admin credentials globally
    adminUsername: 'Martin Kaonga',
    adminPassword: '(Ky)gX,0po]<qMOOF!6$',
    
    // Admin Recovery Email
    // This email is used for password recovery verification
    recoveryEmail: 'martinkaonga@yahoo.com'
};

// Make Config available globally
window.Config = Config;
