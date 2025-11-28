🛡️ Private Identity DApp

一个基于 Zama FHEVM 的隐私保护身份验证应用。用户可以在链上存储加密的年龄、信用分数和会员等级，并通过同态加密逻辑进行访问控制（如是否成年、是否 VIP），在不泄露原始数据的情况下完成验证。

✨ 功能特性
🔒 隐私保护：用户的年龄、信用分数、会员等级均以同态加密形式存储，合约无法直接读取明文。

✅ 访问控制：

checkIsAdult：判断用户是否年满 18 岁。

checkIsVIP：判断用户是否为 VIP（信用分数 > 700 或会员等级为 Gold）。

🧑‍💻 前端交互：

用户可以在网页端提交加密身份信息。

前端调用合约并通过 Relayer 解密结果，显示访问是否被授予。

🌐 跨平台部署：支持本地运行，也可部署到 Vercel 等平台。

🛠️ 技术栈
Solidity：智能合约逻辑，使用 Zama 提供的 FHE 库。

TypeScript + React/Next.js：前端界面与交互。

ethers.js：与合约交互。

Zama FHEVM SDK：生成密钥对、构造 EIP712 签名、调用 Relayer 解密。

🚀 本地运行
Prerequisites: Node.js (>= 18)

安装依赖：

bash
npm install
启动开发环境：

bash
npm run dev
打开浏览器访问：

Code
http://localhost:3000
🌍 部署到 Vercel
将项目推送到 GitHub。

登录 Vercel，点击 New Project。

选择仓库，确认构建命令：

Next.js: npm run build

React: npm run build

点击 Deploy，完成后即可获得一个公网地址。

📖 使用流程
用户调用 setIdentity 提交加密的年龄、信用分数和会员等级。

前端调用 checkIsAdult 或 checkIsVIP，合约返回加密的布尔值。

前端通过 Relayer 调用 userDecryptEbool 解密结果。

页面显示访问是否 GRANTED 或 DENIED。

📝 示例日志输出
前端会在关键步骤打印日志，方便调试：

Code
AccessCheck: Starting check: checkIsAdult
Encrypted handle: 0x8b7e445e...
Decryption: Result: GRANTED
AccessCheck: Finished check: checkIsAdult
📌 TODO / Roadmap
[ ] 增加更多身份属性（如收入、学历）。

[ ] 优化前端 UI。

[ ] 增加多用户场景支持。

[ ] 部署到主网并支持钱包插件。
