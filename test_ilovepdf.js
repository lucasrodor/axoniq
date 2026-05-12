const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
const instance = new ILovePDFApi(process.env.ILOVEPDF_PUBLIC_KEY, process.env.ILOVEPDF_SECRET_KEY);
console.log(instance);
