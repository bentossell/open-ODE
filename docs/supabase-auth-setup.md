# Supabase Authentication Setup Guide (2025)

This guide covers email authentication setup and best practices for Supabase in 2025.

## Table of Contents
1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Email Authentication Methods](#email-authentication-methods)
4. [Custom SMTP Configuration](#custom-smtp-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Implementation Examples](#implementation-examples)

## Overview

Supabase provides several authentication methods:
- **Password-based authentication** (traditional email/password)
- **Passwordless authentication** (magic links and OTP)
- **Social OAuth providers**
- **Phone authentication**

Email authentication is enabled by default in Supabase projects.

## Initial Setup

### 1. Configure Authentication URLs

```javascript
// In your Supabase dashboard:
// 1. Go to Authentication > URL Configuration
// 2. Set your Site URL (e.g., https://yourapp.com)
// 3. Add Redirect URLs (e.g., https://yourapp.com/auth/callback)
```

### 2. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 3. Initialize Supabase Client

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Email Authentication Methods

### Password-Based Authentication

#### Sign Up
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: 'https://yourapp.com/welcome',
    data: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
})
```

#### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})
```

#### Password Reset
```javascript
// Step 1: Request password reset
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourapp.com/reset-password',
  }
)

// Step 2: Update password (on reset page)
const { data, error } = await supabase.auth.updateUser({
  password: 'new-secure-password'
})
```

### Passwordless Authentication

#### Magic Links
```javascript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: false,
    emailRedirectTo: 'https://yourapp.com/welcome'
  }
})
```

#### One-Time Password (OTP)
```javascript
// Step 1: Send OTP
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: true,
  }
})

// Step 2: Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'email'
})
```

## Custom SMTP Configuration

### Production SMTP Setup

The default Supabase email service is limited to 2 emails per hour and is best-effort only. For production, configure a custom SMTP server.

#### Recommended Providers
- Resend
- AWS SES
- Postmark
- SendGrid
- Brevo
- ZeptoMail

#### Configuration Example (via Dashboard)
1. Navigate to Authentication > Settings
2. Under SMTP Settings, configure:
   - **Host**: smtp.sendgrid.net
   - **Port**: 587
   - **Username**: apikey
   - **Password**: your-sendgrid-api-key
   - **Sender email**: no-reply@yourapp.com
   - **Sender name**: Your App Name

#### Configuration via API
```bash
curl -X PUT https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp_host": "smtp.sendgrid.net",
    "smtp_port": 587,
    "smtp_user": "apikey",
    "smtp_pass": "your-sendgrid-api-key",
    "smtp_sender_email": "no-reply@yourapp.com",
    "smtp_sender_name": "Your App Name"
  }'
```

## Security Best Practices

### 1. Email Security
- **Domain Configuration**: Set up DKIM, DMARC, and SPF records
- **Separate Domains**: Use different domains for auth (auth.example.com) and marketing (marketing.example.com)
- **Sender Addresses**: Use distinct addresses (no-reply@auth.example.com vs no-reply@marketing.example.com)

### 2. Rate Limiting
- Magic links: Limited to once per 60 seconds
- Links expire after 1 hour
- OTP maximum expiry: 86400 seconds (1 day)

### 3. Password Security
```javascript
// Enable password strength requirements
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password', // Will be checked against HaveIBeenPwned API
})
```

### 4. Multi-Factor Authentication (MFA)
```javascript
// Enable MFA for user
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'My App'
})

// Verify MFA
const { data, error } = await supabase.auth.mfa.verify({
  factorId: 'factor-id',
  code: '123456'
})
```

### 5. Bot Protection (CAPTCHA)
```javascript
// Configure in Supabase dashboard: Authentication > Settings > Enable CAPTCHA
// Supports hCaptcha and Turnstile

// Frontend implementation
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    captchaToken: 'token-from-captcha-provider'
  }
})
```

### 6. Custom Domain
Set up a custom domain to improve email deliverability:
```
auth.yourapp.com -> your-project.supabase.co
```

## Implementation Examples

### React Component Example
```javascript
import { useState } from 'react'
import { supabase } from './supabaseClient'

function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for the confirmation link!')
    }
    
    setLoading(false)
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    }
    
    setLoading(false)
  }

  const handlePasswordlessLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for the magic link!')
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <h2>Authentication</h2>
      <form>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSignUp} disabled={loading}>
          Sign Up
        </button>
        <button onClick={handleSignIn} disabled={loading}>
          Sign In
        </button>
        <button onClick={handlePasswordlessLogin} disabled={loading}>
          Send Magic Link
        </button>
      </form>
    </div>
  )
}

export default Auth
```

### Session Management
```javascript
// Check if user is logged in
const { data: { user } } = await supabase.auth.getUser()

// Listen for auth changes
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
  
  if (event === 'SIGNED_IN') {
    // Handle sign in
  } else if (event === 'SIGNED_OUT') {
    // Handle sign out
  }
})

// Sign out
const { error } = await supabase.auth.signOut()

// Get session
const { data: { session } } = await supabase.auth.getSession()
```

## Email Template Best Practices

### Content Guidelines
- Keep subject lines short and clear
- Avoid marketing language in auth emails
- Minimize links and CTAs
- Don't include user-provided data (names, emails) in templates
- Avoid emojis in subject lines

### Template Variables
Available variables for email templates:
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .ConfirmationURL }}` - Confirmation link
- `{{ .Token }}` - OTP token (for passwordless)
- `{{ .TokenHash }}` - Hashed token

### Example Custom Template
```html
<h2>Confirm your email</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
```

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check SMTP configuration and rate limits
2. **Invalid redirect URL**: Ensure URL is added to allowed list
3. **User already exists**: Handle duplicate signup attempts
4. **Session expired**: Implement token refresh logic

### Development Testing
For local development, use Supabase CLI with Inbucket:
```bash
supabase start
# Emails are captured at http://localhost:54324
```

## Additional Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Auth Helpers for frameworks](https://supabase.com/docs/guides/auth/auth-helpers)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Server-side Auth](https://supabase.com/docs/guides/auth/server-side-auth)