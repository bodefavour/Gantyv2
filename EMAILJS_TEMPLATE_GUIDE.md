# EmailJS Template for User Invitations

## Template Setup Instructions

1. **Go to EmailJS Dashboard**: https://www.emailjs.com/
2. **Create a Service** (Gmail, Outlook, etc.)
3. **Create a Template** with the following content:

## Email Template Structure

### Subject Line:
```
You're invited to join {{workspace_name}} on GanttPro
```

### Email Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to {{workspace_name}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0d9488; margin: 0;">📊 GanttPro</h1>
    </div>
    
    <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #1f2937;">You're invited to join {{workspace_name}}!</h2>
        
        <p>Hi {{to_name}},</p>
        
        <p><strong>{{inviter_name}}</strong> has invited you to join <strong>{{workspace_name}}</strong> as a <strong>{{role}}</strong>.</p>
        
        <p>GanttPro helps teams plan, track, and collaborate on projects with powerful Gantt charts and task management tools.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{accept_url}}" 
               style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Accept Invitation
            </a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;">
                ⏰ <strong>This invitation expires in {{expires_in}}</strong>
            </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{accept_url}}" style="color: #0d9488; word-break: break-all;">{{accept_url}}</a>
        </p>
    </div>
    
    <div style="text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p>
            This invitation was sent by {{inviter_name}} from {{workspace_name}}<br>
            If you didn't expect this invitation, you can safely ignore this email.
        </p>
    </div>
</body>
</html>
```

## Template Variables (Parameters)

Make sure your EmailJS template includes these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Recipient's email address | `john@company.com` |
| `{{to_name}}` | Recipient's name (extracted from email) | `john` |
| `{{workspace_name}}` | Name of the workspace | `Acme Corp Projects` |
| `{{role}}` | Role being assigned | `manager`, `member`, etc. |
| `{{inviter_name}}` | Person sending the invitation | `Jane Smith` |
| `{{accept_url}}` | Link to accept the invitation | `https://yourapp.com/invite/accept/token123` |
| `{{expires_in}}` | Expiration timeframe | `7 days` |

## EmailJS Configuration Steps

1. **Service Setup**:
   - Choose your email provider (Gmail recommended)
   - Follow EmailJS setup instructions
   - Copy the Service ID

2. **Template Setup**:
   - Create new template
   - Paste the HTML content above
   - Ensure all `{{variable}}` placeholders are recognized
   - Copy the Template ID

3. **Public Key**:
   - Go to Account → API Keys
   - Copy your Public Key

4. **Update your .env file**:
```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## Testing the Template

After setup, test by:
1. Going to Settings → Team Management
2. Click "Invite Team Member"
3. Enter a test email and role
4. Check if the email is received with proper formatting

## Troubleshooting

- **Email not sending**: Check service configuration and API limits
- **Variables not populating**: Ensure template variables match exactly
- **Formatting issues**: Test with EmailJS template preview
- **Blocked emails**: Check spam folder and sender reputation
