import emailjs from '@emailjs/browser';

// EmailJS configuration
export const emailConfig = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

// Only initialize EmailJS if we have the required config
if (emailConfig.publicKey && emailConfig.serviceId && emailConfig.templateId) {
  emailjs.init(emailConfig.publicKey);
}

export interface InviteData {
  to_email: string;
  to_name: string;
  from_name: string;
  project_name: string;
  role: 'viewer' | 'editor' | 'admin';
  invite_link: string;
  workspace_name: string;
}

export const sendInviteEmail = async (inviteData: InviteData): Promise<boolean> => {
  try {
    // Check if EmailJS is properly configured
    if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
      console.warn('EmailJS not configured. Email would be sent with:', inviteData);
      // Return true for demo purposes - in production you'd return false
      return true;
    }

    const templateParams = {
      to_email: inviteData.to_email,
      to_name: inviteData.to_name,
      from_name: inviteData.from_name,
      project_name: inviteData.project_name,
      role: inviteData.role,
      invite_link: inviteData.invite_link,
      workspace_name: inviteData.workspace_name,
      reply_to: inviteData.to_email,
    };

    const response = await emailjs.send(
      emailConfig.serviceId,
      emailConfig.templateId,
      templateParams
    );

    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default emailjs;
