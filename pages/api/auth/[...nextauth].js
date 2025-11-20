import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { google } from 'googleapis';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials) {
          console.log("No credentials provided");
          return null;
        }

        console.log("Attempting to authorize user:", credentials.username);

        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID_SETUPSHEET,
            range: 'Users',
          });

          const rows = response.data.values;
          if (rows) {
            const header = rows[0];
            const usernameIndex = header.indexOf('Username');
            const passwordIndex = header.indexOf('Password Hash');
            const roleIndex = header.indexOf('Role');
            const moduleAccessIndex = header.indexOf('Module Access');
            const activeIndex = header.indexOf('Active');

            const userRow = rows.slice(1).find(row => row[usernameIndex] === credentials.username);

            if (userRow) {
              console.log("User found in sheet:", userRow[usernameIndex]);
              const isActive = userRow[activeIndex] && userRow[activeIndex].toUpperCase() === 'TRUE';

              if (userRow[passwordIndex] === credentials.password && isActive) {
                console.log("User authenticated successfully");
                return {
                  id: userRow[0],
                  name: userRow[usernameIndex],
                  role: userRow[roleIndex],
                  moduleAccess: JSON.parse(userRow[moduleAccessIndex])
                };
              } else {
                console.log("Password or active status check failed");
              }
            } else {
              console.log("User not found in sheet");
            }
          }
          return null;
        } catch (error) {
          console.error("Error fetching user data from Google Sheets:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.moduleAccess = user.moduleAccess;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.moduleAccess = token.moduleAccess;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
