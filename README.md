# Locksy - Password Manager

A secure password manager application built with HTML, CSS, JavaScript, and Firebase.

## Features

- **Secure Authentication**: Login with admin credentials only
- **Password Management**: Store, view, edit, and delete passwords
- **Search Functionality**: Quick search through all your passwords
- **Modern UI**: Beautiful, responsive design with dark mode support
- **Custom Fields**: Add unlimited custom fields to each password entry
- **Password Generator**: Generate strong random passwords
- **Copy to Clipboard**: Quick copy buttons for all fields
- **2FA Support**: Store Google Auth keys and 2FA links

## Login Credentials

```
Email: admin@example.com
Password: 1357ac09J@J
```

## How to Use

1. **Login**: Use the admin credentials above to login
2. **Add Password**: Click the floating "+" button in the bottom right
3. **Search**: Use the search bar to find specific passwords
4. **View Details**: Click the eye icon on any card to view full details
5. **Edit**: Click the edit icon to modify an existing password
6. **Delete**: Click the trash icon to remove a password
7. **Dark Mode**: Toggle dark mode using the moon/sun icon in the header

## Password Fields

Each password entry can store:
- Name (required)
- Website URL
- Username
- Email
- Password
- Google Auth Key
- Recovery Email
- 2FA Link
- Notes
- Unlimited custom fields

## Features

### Password Generation
Click the dice icon next to the password field to generate a strong 16-character password.

### Quick Copy
All sensitive fields have copy buttons for quick clipboard access.

### Search
The search function searches through all fields including:
- Name
- Website URL
- Username
- Email
- Notes

### Dark Mode
Toggle between light and dark themes. Your preference is saved locally.

## Security Notes

- All data is stored in Firebase Realtime Database
- Authentication is handled by Firebase Auth
- Passwords are stored in plain text in the database (for demo purposes)
- In production, passwords should be encrypted before storage

## Browser Compatibility

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Mobile Responsive

The application is fully responsive and works on all device sizes.

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- JavaScript (ES6+)
- Firebase Authentication
- Firebase Realtime Database
- Font Awesome Icons
- Google Fonts (Inter)
