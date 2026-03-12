# 📋 Verification Badge System Guide

This guide explains how to use the verification badge system in the HommieApp for both users and administrators.

## 🎯 **What is the Verification System?**

The verification system allows users to verify their identity to build trust in the marketplace. Admins can approve, reject, or manage verification requests from the admin dashboard.

## 🔧 **How to Add Verification Badge to Components**

### 1. **Import the Component**
```typescript
import VerificationBadge from '../../components/VerificationBadge';
```

### 2. **Basic Usage**
```typescript
<VerificationBadge 
  status={verificationStatus} 
  size="medium" 
  showText={true}
/>
```

### 3. **Available Sizes**
- `small`: Compact badge (icon only)
- `medium`: Standard badge (icon + text)
- `large`: Large badge (icon + larger text)

### 4. **Available Statuses**
- `verified`: Green badge with checkmark
- `pending`: Yellow badge with clock
- `rejected`: Red badge with X
- `unverified`: Gray badge with alert

## 📱 **In Mobile App Integration**

### **Profile Screen**
The verification badge appears next to the user's role in the profile section:

```typescript
<View style={styles.userInfo}>
  <Text style={styles.name}>{user?.full_name || 'User'}</Text>
  <View style={styles.roleRow}>
    <Text style={styles.role}>{formatRole(user?.role)}</Text>
    <VerificationBadge 
      status={user?.verification_status || 'unverified'} 
      size="small" 
      showText={false}
    />
  </View>
</View>
```

### **Property Cards**
Verification badges appear on property cards showing the owner's verification status:

```typescript
<View style={styles.ownerRow}>
  <Text style={styles.ownerLabel}>
    Listed by {ownerName}
  </Text>
  <VerificationBadge 
    status={property.owner?.verification_status || 'unverified'} 
    size="small" 
    showText={false}
  />
</View>
```

## 🖥️ **Admin Dashboard Integration**

### **Access Verification Management**
1. Navigate to **Verification** in the admin dashboard sidebar
2. View verification statistics and user lists
3. Manage verification status with one-click actions

### **Available Actions**
- **Approve**: Sets user status to 'verified'
- **Reject**: Sets user status to 'rejected'
- **Set to Pending**: Sets user status to 'pending'

### **Verification Statistics Dashboard**
The verification page shows:
- Total users count
- Verified users count
- Pending verifications count
- Rejected verifications
- Unverified users count

## 🔐 **Admin Verification Actions**

### **Approving a User**
1. Go to **Verification** in admin dashboard
2. Find the user in the list
3. Click the green checkmark icon
4. User status changes to 'verified'
5. User receives notification

### **Rejecting a User**
1. Find the user in the verification list
2. Click the red X icon
3. User status changes to 'rejected'
4. User receives notification

### **Setting to Pending**
1. Find unverified user
2. Click the yellow clock icon
3. User status changes to 'pending'
4. User can restart verification process

## 📱 **Verification Process Flow**

### **For Users:**
1. **Start Verification**: Go to Profile → Verification
2. **Upload Documents**: Upload ID documents
3. **Submit**: Submit for admin review
4. **Wait**: Admin reviews documents
5. **Get Status**: Receive approval/rejection notification
6. **Verified**: Get green badge and trust benefits

### **For Admins:**
1. **Review**: User submits verification documents
2. **Validate**: Check authenticity of documents
3. **Approve/Reject**: One-click status updates
4. **Notify**: User receives instant notification
5. **Track**: Monitor verification statistics

## 🎯 **Benefits of Verification**

### **For Verified Users:**
- ✅ **Trust Badge**: Green verification badge on profile
- ✅ **Increased Visibility**: Higher ranking in search results
- ✅ **Owner Trust**: "Verified Owner" badge on property listings
- ✅ **Booking Priority**: Priority access to new features

### **For Marketplace:**
- ✅ **Reduced Risk**: Verified users are more trustworthy
- ✅ **Quality Control**: Admin-reviewed verification process
- ✅ **User Safety**: Identity verification reduces fraud
- ✅ **Professional Image**: Verified status builds confidence

## 🚀 **Quick Start Guide**

### **For Admins:**
1. Access admin dashboard
2. Navigate to Verification section
3. Review pending verifications
4. Approve/reject users as needed

### **For Users:**
1. Go to Profile → Verification
2. Upload required documents
3. Submit for review
4. Wait for admin approval

### **For Developers:**
```typescript
import VerificationBadge from './components/VerificationBadge';

// Add to any user or property component
<VerificationBadge 
  status={user.verification_status} 
  size="medium" 
  showText={true}
/>
```

## 📞 **Troubleshooting**

### **Badge Not Showing:**
- Check if `verification_status` is properly set
- Ensure VerificationBadge component is imported
- Verify styles are correctly applied

### **Status Not Updating:**
- Refresh the page
- Check admin permissions
- Verify database connection

### **Admin Actions Not Working:**
- Check admin role permissions
- Verify user authentication
- Check network connectivity

## 🔧 **Customization Options**

### **Badge Colors:**
```typescript
// In VerificationBadge.tsx
verified: {
  backgroundColor: '#00C853',
},
pending: {
  backgroundColor: '#FF9800',
},
rejected: {
  backgroundColor: '#FF3B30',
},
unverified: {
  backgroundColor: '#9CA3AF',
},
```

### **Badge Sizes:**
```typescript
small: {
  paddingHorizontal: 6,
  paddingVertical: 2,
  gap: 2,
},
medium: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  gap: 4,
},
large: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  gap: 6,
},
```

## 🎯 **Best Practices**

1. **Always show verification status** on user profiles
2. **Use consistent sizing** across the app
3. **Add badges to property cards** for owner verification
4. **Implement proper status transitions**
5. **Send notifications** for status changes

The verification badge system is now fully integrated and ready to use! 🎉
