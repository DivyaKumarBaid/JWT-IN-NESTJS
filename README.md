# Auth using JWT in NESTJS
This is a micro service that contains basic auth 

## Introduction
This is a microservice built in nestjs as a base for authentication template. This microservice uses JWT tokens (access and refresh tokens)

#### Tech Stack
- NestJs
- Postgres
- Docker
- Prisma

## Working around
Development Server :
- Clone the repo
- `npm install`
- `docker compose up -d`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npx prisma db push`
- `npm run start:dev`


### Supported Auth System
- Google
- Local using credentials : Email and password

### WorkFlow
- User will Sign-up either by email or by google
- If done by email
    - Users are asked for email, password, username
    - User is added to a table (collection) of unverified users and an email is sent containing otp
    - User is then redirected to otp page where they can provide otp and are moved to verified table
- If done by google
    - Users just signin using google and the access token from google.users is send to backend
    - If the user doesnt exist, they would be added directly to verified users table
    - Tf the user exist, they would be logged in directly
- On login, two tokens are provided : access token and refresh token
- For google loggedin users, the user object if first saved and then are provided for generation of access token and refresh token
- Password for google logged-in users are their token and saved as hashed part
- The refresh token is kept in database as hashed to verify user
- The validity of access token is kept as 15 mins and refresh token for 7 days
- After every 10min the access token is sent to `auth/refresh` to get new pair of tokens
- For logout, hashed refresh token is deleted from Database
- For resetting password, the auth controller has password reset api

### User Type
Change the user type as needed, the version currently supports google using access_token from the signin page and then decoding it in server itself using google-auth-library
User has the following properties :
```ts
  id           Int      @id @default(autoincrement())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  email        String   @unique
  username     String
  password     String
  hashRT       String?
  role         String   @default("user")
  signInMethod String   @default("local.com")
```
Description as follows :
  id            primary key
  createdAt     @createdAt
  updatedAt     @updatedAt
  email         unique identifier
  username      name
  password      hashed user password to match
  hashRT        verified when new access_token request is made available
  role          to support role based routes in future
  signInMethod  Signup Provider used (google.com/local)

### Concept for two tables
Keeping two separate tables for two types of user was a design choice since its better not to cluter same table with tags as verified/unverified.
One is unverified_user and another is user
The unverified_user table is generally filled with users who are unverified and cannot access all the routes available to a signin user and thus this has more trash data then the users table that only contains verified user.
The unverified_user table has more write and the user table has more read operations and thus these can be separated as two different collections/db in future.

### Comcept for Email OTP
For verification email otp is used along with frontends knowledge of id which is send along in the response to frontend when user signs up and this prevents any other session accessing the same verify screen. For now its a 4 digit otp which can be increased to 6.

### About Environmental Variables
```
# DATABASE_URL="postgresql://postgres:123@localhost:5432/nestjs?schema=public"
DATABASE_URL="XXXX"
JWT_SECRET="XXXX"
RT_SECRET="XXXX"
AT_SECRET="XXXX"
MAIL_PASS="XXXX"
MAIL_ID="XXXX"
MAIL_HOST="smtp.gmail.com"
APP_NAME="XXXX"
COMPANY_LOGO="XXXX"
GOOGLE_CLIENT_ID="XXXX"
# GOOGLE_CLIENT_ID must be same as frontend
```
If using the docker provided, database url would be similar to what's there in sample env, changing password or db_name would would also require change in URL.
*_SECRET are used to generate JWT Tokens
MAIL_PASS would be required in order to send verification mails. ** Note this is not your regular password, if using gmail, this is obtained from https://myaccount.google.com/apppasswords?<-your-id>, basically from google account > app password **
MAIL_ID is the email address from which the verification mail is to be send, and MAIL_PASS is token for the same email id.
MAIL_HOST is the smtp host, for google its smtp.gmail.com, if using any other email domain, search the internet.
APP_NAME is your applications name
COMPANY_LOGO is the url for your companys logo
GOOGLE_CLIENT_ID can be obtained from google cloud platform, you need to create a project and then create credentails
** Note that the server decode the access_token sent from frontend, thus frontend would also use same client_id **

### Notes 
- If the user has already logged in from google, they can log in from email but then need to reset password.
- For google logged in users, their would be a field signedInMethod and this is either local.com -> implying done with email or google.com implying done using google.
- If a user is logged in with a gmail as local i.e. using email, they can directly login using google signin method and will retain all info.


### Postman
[Title](Auth_base_template.postman_collection.json) contains all the routes required with example
