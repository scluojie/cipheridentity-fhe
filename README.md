🛡️ Private Identity DApp

A privacy-preserving identity verification application built on Zama FHEVM. Users can store encrypted attributes (age, credit score, membership tier) on-chain and perform access control checks (e.g., adult verification, VIP status) using homomorphic encryption, without exposing raw data.

✨ Features
🔒 Privacy-first: Age, credit score, and membership tier are stored as encrypted values. No plaintext is revealed on-chain.

✅ Access Control:

checkIsAdult: Verify if a user is at least 18 years old.

checkIsVIP: Verify if a user qualifies as VIP (credit score > 700 or Gold tier).

🧑‍💻 Frontend Interaction:

Users submit encrypted identity data via the web interface.

The frontend calls contract functions and uses the Relayer to decrypt results, displaying whether access is granted.

🌐 Deployment Ready: Can run locally or be deployed to platforms like Vercel.

🛠️ Tech Stack
Solidity: Smart contract logic using Zama’s FHE library.

TypeScript + React/Next.js: Frontend UI and interaction.

ethers.js: Blockchain interaction.

Zama FHEVM SDK: Keypair generation, EIP712 signing, and Relayer decryption.

🚀 Run Locally
Prerequisites: Node.js (>= 18)

Install dependencies:

bash
npm install
Start the development server:

bash
npm run dev
Open your browser at:

Code
http://localhost:3000
🌍 Deploy to Vercel
Push your project to GitHub.

Log in to Vercel and click New Project.

Select your repository and confirm build settings:

Next.js: npm run build

React: npm run build

Click Deploy and get a public URL.

📖 Usage Flow
User calls setIdentity to submit encrypted age, credit score, and tier.

Frontend calls checkIsAdult or checkIsVIP; contract returns an encrypted boolean.

Frontend uses Relayer and userDecryptEbool to decrypt the result.

The page displays whether access is GRANTED or DENIED.

📝 Example Logs
Frontend prints logs at key steps for debugging:

Code
AccessCheck: Starting check: checkIsAdult
Encrypted handle: 0x8b7e445e...
Decryption: Result: GRANTED
AccessCheck: Finished check: checkIsAdult
📌 Roadmap
[ ] Add more identity attributes (e.g., income, education).

[ ] Improve frontend UI/UX.

[ ] Support multi-user scenarios.

[ ] Deploy to mainnet with wallet integration.
