export const PORT = process.env.PORT && !Number.isNaN(+process.env.PORT) ? parseInt(process.env.PORT, 10) : 3000;
