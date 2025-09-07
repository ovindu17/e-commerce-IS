# E-Commerce Application Setup Guide

Complete setup guide to run this full-stack e-commerce application from scratch.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Overview](#project-overview)
- [Azure AD Configuration](#azure-ad-configuration)
- [Database Setup](#database-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Admin Configuration](#admin-configuration)
- [Testing the Application](#testing-the-application)
- [Troubleshooting](#troubleshooting)

## 🛠️ Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://mysql.com/downloads/)
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** (VS Code recommended) - [Download here](https://code.visualstudio.com/)

### Required Accounts
- **Azure AD Account** - [Create free account](https://azure.microsoft.com/free/)
- **Microsoft 365 Developer Account** (optional, for testing)

### Verify Installation
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 8.x.x or higher
mysql --version   # Should show 8.x.x or higher
git --version     # Should show 2.x.x or higher
```

## 📁 Project Overview

This is a full-stack e-commerce application with:

```
web/
├── front/          # React.js frontend (Vite + Tailwind CSS)
├── back/           # Node.js backend (Express.js + MySQL)
├── database/       # Database migrations and sample data
└── docs/          # Documentation
```

**Tech Stack:**
- **Frontend**: React 18, Vite, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js, Express.js, MySQL2
- **Authentication**: Azure AD (OAuth2/OpenID Connect)
- **Database**: MySQL 8.0
- **Security**: Helmet, Rate Limiting, OWASP compliant

## 🔐 Azure AD Configuration

### Step 1: Create Azure AD App Registration

1. **Go to Azure Portal**:
   - Visit [Azure Portal](https://portal.azure.com)
   - Sign in with your Microsoft account

2. **Create App Registration**:
   - Navigate to `Azure Active Directory` > `App registrations`
   - Click `New registration`
   - Fill out the form:
     ```
     Name: E-Commerce App
     Supported account types: Accounts in any organizational directory and personal Microsoft accounts
     Redirect URI: Single-page application (SPA) - http://localhost:5173
     ```
   - Click `Register`

3. **Configure Authentication**:
   - Go to `Authentication` in the left menu
   - Add these redirect URIs:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   - Under `Implicit grant and hybrid flows`:
     - ✅ Check `Access tokens`
     - ✅ Check `ID tokens`
   - Save changes

4. **Configure API Permissions**:
   - Go to `API permissions`
   - Click `Add a permission`
   - Select `Microsoft Graph`
   - Select `Delegated permissions`
   - Add these permissions:
     ```
     - User.Read
     - profile
     - openid
     - email
     - Directory.Read.All (for admin features)
     ```
   - Click `Grant admin consent` (if you're admin)

5. **Get Configuration Values**:
   - Go to `Overview`
   - Copy these values (you'll need them later):
     ```
     Application (client) ID: [Your Client ID]
     Directory (tenant) ID: [Your Tenant ID]
     ```

## 🗄️ Database Setup

### Step 1: Start MySQL Service

**Windows:**
```bash
# Start MySQL service
net start mysql
```

**macOS:**
```bash
# Start MySQL using Homebrew
brew services start mysql
```

**Linux:**
```bash
# Start MySQL service
sudo systemctl start mysql
```

### Step 2: Create Database

1. **Connect to MySQL**:
   ```bash
   mysql -u root -p
   ```

2. **Create Database and User**:
   ```sql
   -- Create database
   CREATE DATABASE ecommerce_db;
   
   -- Create user (optional - use root for development)
   CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   
   -- Grant permissions
   GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce_user'@'localhost';
   FLUSH PRIVILEGES;
   
   -- Exit MySQL
   EXIT;
   ```

### Step 3: Run Database Migrations

Navigate to the backend directory and run migrations:

```bash
cd back
```

**Run each migration file in order:**

1. **Users Table**:
   ```bash
   mysql -u root -p ecommerce_db < migrations/create_users_table.sql
   ```

2. **Products Tables**:
   ```bash
   mysql -u root -p ecommerce_db < migrations/create_products_table.sql
   ```

3. **Cart Tables**:
   ```bash
   mysql -u root -p ecommerce_db < migrations/create_cart_tables.sql
   ```

4. **Orders Tables**:
   ```bash
   mysql -u root -p ecommerce_db < migrations/create_orders_tables.sql
   ```

5. **Sample Data** (optional):
   ```bash
   mysql -u root -p ecommerce_db < migrations/sample_products.sql
   ```

### Step 4: Verify Database Setup

```bash
mysql -u root -p ecommerce_db -e "SHOW TABLES;"
```

You should see:
```
+-------------------------+
| Tables_in_ecommerce_db  |
+-------------------------+
| cart_items             |
| order_items            |
| order_status_history   |
| orders                 |
| products               |
| user_carts             |
| users                  |
+-------------------------+
```

## 🔧 Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd back
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

1. **Copy Environment File**:
   ```bash
   cp .env.example .env
   ```

2. **Configure Environment Variables**:
   
   Edit `.env` file with your values:
   ```env
   # Azure AD Configuration
   AZURE_CLIENT_ID=your_azure_client_id_here
   AZURE_TENANT_ID=your_azure_tenant_id_here
   
   # Database Configuration  
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ecommerce_db
   DB_PORT=3306
   
   # Security Configuration
   NODE_ENV=development
   PORT=3001
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   
   # Session Secret (generate a strong random string)
   SESSION_SECRET=your-super-secure-random-string-here
   
   # Admin Configuration (replace with your email)
   ADMIN_EMAILS=your-email@example.com
   ADMIN_DOMAINS=yourdomain.com
   ```

### Step 4: Test Backend Connection

```bash
npm run dev
```

You should see:
```
🚀 Server is running on port 3001
📝 Environment: development
🔒 Security middleware enabled
🔑 Azure AD authentication configured
✅ Database connected successfully
```

If you see any errors, check the [Troubleshooting](#troubleshooting) section.

## 🎨 Frontend Setup

### Step 1: Open New Terminal

Keep the backend running and open a new terminal window.

### Step 2: Navigate to Frontend Directory

```bash
cd front
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Environment Configuration

1. **Copy Environment File**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure Environment Variables**:
   
   Edit `.env.local` file:
   ```env
   # Azure AD Configuration
   VITE_AZURE_CLIENT_ID=your_azure_client_id_here
   VITE_AZURE_TENANT_ID=your_azure_tenant_id_here
   
   # API Configuration
   VITE_API_BASE_URL=http://localhost:3001/api
   
   # Redirect URIs
   VITE_REDIRECT_URI=http://localhost:5173
   VITE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
   ```

### Step 5: Start Frontend Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🚀 Running the Application

### Full Application Startup

1. **Terminal 1 - Backend**:
   ```bash
   cd back
   npm run dev
   ```

2. **Terminal 2 - Frontend**:
   ```bash
   cd front  
   npm run dev
   ```

3. **Open Browser**:
   - Visit: http://localhost:5173
   - You should see the e-commerce homepage

### Application URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Admin Panel**: http://localhost:5173/admin

## 👨‍💼 Admin Configuration

### Method 1: Email-based Admin (Recommended for Development)

1. **Update Backend `.env`**:
   ```env
   ADMIN_EMAILS=your-email@example.com,another-admin@example.com
   ```

2. **Restart Backend**:
   ```bash
   # Stop backend (Ctrl+C) and restart
   npm run dev
   ```

3. **Test Admin Access**:
   - Sign in with the email you specified
   - Visit http://localhost:5173/admin
   - You should see the admin dashboard

### Method 2: Azure AD Roles (Production)

1. **In Azure AD Admin Center**:
   - Go to Azure Active Directory > Users
   - Select your user
   - Click "Assigned roles" > "Add assignments"
   - Add "Global Administrator" or "Application Administrator"

2. **Access Admin Panel**:
   - Sign in to the application
   - Visit http://localhost:5173/admin

### Method 3: Temporary Testing (Development Only)

1. **Edit Backend Code** (temporary):
   ```javascript
   // In /back/config/azureAd.js, line 97
   return true  // This makes ALL logged-in users admin
   ```

2. **⚠️ IMPORTANT**: Remove this line before production!

## 🧪 Testing the Application

### 1. Basic Functionality Test

1. **Homepage**: Visit http://localhost:5173
   - Should show product catalog
   - Navigation should work
   - Search should function

2. **Authentication**:
   - Click "Sign In"
   - Sign in with Microsoft account
   - Should redirect back to homepage
   - User name should appear in navigation

3. **Shopping Cart**:
   - Add products to cart
   - View cart (click cart icon)
   - Modify quantities
   - Proceed to checkout

4. **Checkout Process**:
   - Fill out shipping address
   - Complete profile if prompted
   - Place order
   - Should redirect to confirmation page

5. **Profile Management**:
   - Visit http://localhost:5173/profile
   - Update profile information
   - View order history

6. **Admin Panel** (if configured):
   - Visit http://localhost:5173/admin
   - View dashboard statistics
   - Manage orders
   - Update order statuses

### 2. API Testing

Test backend endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:3001/health

# Get products
curl http://localhost:3001/api/products

# Test API routes
curl http://localhost:3001/api/test
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Failed

**Error**: `❌ Database connection failed`

**Solutions**:
```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Start MySQL service
sudo systemctl start mysql  # Linux
brew services start mysql  # macOS

# Check database credentials in .env file
# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"
```

#### 2. Azure AD Authentication Issues

**Error**: `Invalid client ID` or `AADSTS errors`

**Solutions**:
1. **Verify Azure AD Configuration**:
   - Check Client ID in Azure Portal matches `.env` files
   - Ensure redirect URIs are correctly configured
   - Verify API permissions are granted

2. **Clear Browser Cache**:
   - Clear cookies and local storage
   - Try incognito/private browsing mode

3. **Check Network**:
   - Ensure firewall allows connections to `login.microsoftonline.com`

#### 3. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solutions**:
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr 3001  # Windows

# Kill the process
kill -9 [PID]  # macOS/Linux
taskkill /F /PID [PID]  # Windows

# Or use different port in .env
PORT=3002
```

#### 4. Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solutions**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest
```

#### 5. CORS Errors

**Error**: `Access to fetch ... has been blocked by CORS policy`

**Solutions**:
1. **Check CORS Configuration**:
   - Verify `ALLOWED_ORIGINS` in backend `.env`
   - Ensure frontend URL is included

2. **Update CORS Settings**:
   ```env
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
   ```

#### 6. Admin Access Denied

**Error**: `403 - Admin access required`

**Solutions**:
1. **Check Admin Email**:
   ```env
   ADMIN_EMAILS=your-actual-email@example.com
   ```

2. **Restart Backend**:
   ```bash
   # Stop and restart backend after .env changes
   npm run dev
   ```

3. **Temporary Admin Access**:
   ```javascript
   // In /back/config/azureAd.js (line 97)
   return true  // TEMPORARY: Makes all users admin
   ```

### Getting Help

If you encounter issues not covered here:

1. **Check Console Logs**:
   - Browser Developer Tools (F12)
   - Backend terminal output
   - Network tab for API errors

2. **Verify Environment**:
   - Double-check all `.env` file values
   - Ensure all services are running
   - Check file permissions

3. **Common Commands**:
   ```bash
   # Restart everything
   npm run dev  # In both front and back directories
   
   # Check logs
   npm run dev 2>&1 | tee debug.log
   
   # Test database connection
   mysql -u root -p ecommerce_db -e "SELECT 1;"
   ```

## 🎯 Next Steps

Once you have the application running:

1. **Customize Products**: Add your own products to the database
2. **Branding**: Update colors, logos, and styling
3. **Payment Integration**: Add Stripe or PayPal integration
4. **Email Notifications**: Set up order confirmation emails
5. **Production Deployment**: Deploy to cloud providers (AWS, Azure, etc.)

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🔒 Security Notes

This application implements OWASP Top 10 security best practices:

- ✅ Authentication via Azure AD
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React + CSP headers)
- ✅ Rate limiting and security headers
- ✅ Input validation and sanitization
- ✅ Comprehensive security logging

For production deployment, ensure:
- HTTPS is enabled
- Environment variables are secured
- Database is properly configured with restricted access
- Regular security updates are applied

---

**Happy coding! 🚀**

If you encounter any issues, please check the troubleshooting section or consult the documentation for individual components.