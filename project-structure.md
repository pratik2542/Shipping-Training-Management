/d:/PM/
├── api/
│   ├── notify-admin.js     # Vercel serverless function for email notifications
│   └── index.js           # Main API file
├── public/
│   ├── index.html
│   └── _redirects         # Vercel routing redirects
├── src/
│   ├── components/
│   │   ├── Dashboard.js
│   │   ├── Login.js
│   │   ├── AdminVerification.js
│   │   ├── ShippingForm.js
│   │   ├── Records.js
│   │   ├── PendingStatus.js
│   │   ├── CheckStatus.js
│   │   ├── ForgotPassword.js
│   │   └── Manufacturing/
│   │       ├── Manufacturing.js
│   │       └── forms/
│   │           ├── VitaminDForm.js
│   │           ├── MentholForm.js
│   │           ├── DhaForm.js
│   │           ├── TummyReliefForm.js
│   │           └── VitaminDKForm.js
│   ├── config/
│   │   ├── api.js        # API configuration
│   │   └── firebase/
│   │       ├── config.js     # Main Firebase config
│   │       └── testConfig.js # Test Firebase config
│   ├── utils/
│   │   └── adminCheck.js # Admin route protection
│   ├── theme/
│   │   └── index.js      # MUI theme configuration
│   ├── App.js
│   └── index.js
├── .env                   # Environment variables
├── package.json          # Project dependencies and scripts
└── vercel.json           # Vercel deployment configuration
