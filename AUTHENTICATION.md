# 🔐 Authentication: Email & Password (JWT)

## ✅ Native Auth System Implemented

The application has been migrated from Google/Firebase OAuth to a **native Email & Password authentication system** using MongoDB and JWT.

### Backend Implementation
- **Password Hashing**: Using `bcryptjs` for secure storage.
- **JWT (JSON Web Tokens)**: Tokens are generated upon login/registration.
- **Google OAuth**: Integrated using `google-auth-library` to verify ID tokens.
- **Middleware**: Secure `authMiddleware` verifies JWT on every request.
- **Endpoints**:
  - `POST /api/users/register`: Create new account.
  - `POST /api/users/login`: Authenticate via email/password.
  - `POST /api/users/google-login`: Authenticate via Google ID tokens.

### Frontend Implementation
- **AuthContext**: Updated to manage `signIn`, `register`, and `signOut` via the custom backend.
- **Token Persistence**: JWT is stored in `localStorage` as `auth_token`.
- **LoginPage**: A unified login/signup interface with smooth transitions.

---

## 🚀 How to use

### Sign Up
1. Navigate to http://localhost:8080/login
2. Click **"Don't have an account? Sign up"**
3. Enter your Full Name, Email, and Password.
4. Click **"Create account"**.

### Sign In
1. Enter your Email and Password on the login page.
2. Click **"Sign in"**.

---

## 🛠 Next Steps
- **Password Reset**: Implement "Forgot Password" flow with email verification.
- **Session Refresh**: Add refresh token logic for improved security.
- **Profile Edits**: Allow users to update their password from the profile page.
