# 🚀 IMC ICCC Dashboard - Quick Reference Guide

## 📱 **Mobile Navigation**
- **Hamburger Menu**: Tap the ☰ icon (top-right) on mobile devices
- **Touch Targets**: All buttons are 44px minimum for easy tapping
- **Responsive Design**: Works on phones (320px+), tablets (768px+), desktop (1024px+)

## 🔐 **Authentication**
- **Login**: Email + Password → Admin approval required for new users
- **Roles**: Operator (view data) | Admin (full access)
- **Mobile Login**: Optimized forms with 16px font (prevents iOS zoom)

## 📊 **Dashboard Features**
- **Date Filter**: Select specific dates for historical data
- **Zone Filter**: Filter by specific operational zones  
- **Trip Filter**: Filter vehicles by trip count
- **Live Status**: Green dot = system active, real-time data

## 📈 **Chart Interactions**
- **Desktop**: Click bars/points for vehicle details
- **Mobile**: Tap bars/points for vehicle details
- **Workshop Chart**: Line chart showing departure times vs zones
- **Zone Charts**: Bar charts showing vehicle counts per zone

## 🗄️ **Data Sources**
- **Primary**: Main Google Sheets data pipeline
- **Backup**: 5+ backup sheets for redundancy
- **Real-time**: Automatic data refresh and failover

## ⚙️ **Admin Panel** (Admin Only)
- **User Management**: Approve registrations, assign roles
- **System Monitor**: Check data source health
- **Data Config**: Manage Google Sheets connections
- **Firebase**: Database and authentication management

## 📱 **Mobile Features**
- **Hamburger Menu**: Full navigation in slide-out panel
- **Touch Charts**: Tap-optimized chart interactions
- **Responsive Text**: Font scales automatically (16px→18px→20px+)
- **Mobile Modals**: Full-screen modals on small devices

## 🎨 **UI Components**
- **Cards**: Consistent styling with hover effects
- **Modals**: Vehicle details, admin dashboard
- **Forms**: Login, signup, filters
- **Headers**: IMC branding with user info

## 🔧 **Technical Features**
- **Framework**: React + Vite + Tailwind CSS
- **Charts**: Chart.js with mobile optimization
- **Database**: Firebase authentication & storage
- **Responsive**: Mobile-first design approach

## 📋 **Quick Actions**

### **For Operators**
1. Login → Dashboard loads automatically
2. Use date/zone filters to narrow data
3. Click/tap charts for vehicle details
4. View real-time system status

### **For Admins**
1. Access admin panel via header button
2. Approve pending user registrations
3. Monitor system health and data sources
4. Configure backup data sources

### **For Mobile Users**
1. Tap hamburger menu (☰) for navigation
2. All charts work with touch
3. Forms optimized for mobile keyboards
4. Full functionality on any screen size

## 🚨 **Troubleshooting**

### **Data Not Loading**
- Check internet connection
- Verify Google Sheets access
- Admin: Check data source status in admin panel

### **Login Issues**
- Ensure admin has approved your account
- Check email/password combination
- Contact admin for role assignment

### **Mobile Issues**
- Ensure JavaScript is enabled
- Try refreshing the page
- Use supported browsers (Chrome, Safari, Firefox)

### **Chart Not Interactive**
- Ensure you're clicking/tapping directly on bars/points
- Try refreshing the page
- Check if data is available for selected filters

## 📞 **Support**
- **Technical Issues**: Contact system administrator
- **Account Issues**: Contact admin for approval/role changes
- **Data Issues**: Check with data source managers

---

## 🔗 **Related Documentation**
- `WEBSITE_FUNCTIONALITY_DOCUMENTATION.md` - Complete feature documentation
- `MOBILE_RESPONSIVE_ENHANCEMENTS.md` - Mobile design details
- `README.md` - Technical setup and development guide

---

*Quick Reference Guide v1.0 - IMC ICCC Vehicle Report Dashboard*
