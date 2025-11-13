import { useState } from 'react';
import { Lock, Bell, Save, Eye, EyeOff, Shield, User, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './Settings.module.css';

const Setting = ({ student_id, username, token }) => {
  const [formData, setFormData] = useState({
    student_id,
    currentEmail: username,
    newEmail: "",
    password: "",
    confirmPassword: "",
    notifications: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [activeSection, setActiveSection] = useState('password');

  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths = [
      { score: 0, text: '', color: '' },
      { score: 1, text: 'Very Weak', color: 'bg-red' },
      { score: 2, text: 'Weak', color: 'bg-orange' },
      { score: 3, text: 'Fair', color: 'bg-yellow' },
      { score: 4, text: 'Good', color: 'bg-blue' },
      { score: 5, text: 'Strong', color: 'bg-green' }
    ];

    return strengths[score];
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 5000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!formData.password) {
      showNotification('error', 'Please enter your new password.');
      return;
    }

    if (formData.password.length < 8) {
      showNotification('error', 'Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification('error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        student_id: formData.student_id,
        login_id: formData.currentEmail,
        password: formData.password,
      };

      console.log('Password change payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showNotification('success', 'Password updated successfully!');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setPasswordStrength({ score: 0, text: '', color: '' });
      
    } catch (error) {
      console.error('Error updating password:', error);
      showNotification('error', 'Failed to update password. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newEmail) {
      showNotification('error', 'Please enter your new email address.');
      return;
    }

    if (!isValidEmail(formData.newEmail)) {
      showNotification('error', 'Please enter a valid email address.');
      return;
    }

    if (formData.newEmail === formData.currentEmail) {
      showNotification('error', 'New email must be different from current email.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        student_id: formData.student_id,
        current_email: formData.currentEmail,
        new_email: formData.newEmail,
      };

      console.log('Email change payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showNotification('success', 'Email updated successfully! Please verify your new email.');
      setFormData(prev => ({ ...prev, currentEmail: prev.newEmail, newEmail: '' }));
      
    } catch (error) {
      console.error('Error updating email:', error);
      showNotification('error', 'Failed to update email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        student_id: formData.student_id,
        notifications: formData.notifications,
      };

      console.log('Notification settings payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('success', 'Notification preferences updated successfully!');
      
    } catch (error) {
      console.error('Error updating notifications:', error);
      showNotification('error', 'Failed to update notification preferences.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthClass = () => {
    if (passwordStrength.score <= 2) return 'very-weak';
    if (passwordStrength.score === 3) return 'fair';
    if (passwordStrength.score === 4) return 'good';
    return 'strong';
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsWrapper}>
        
        {/* Notification Toast */}
        {notification.show && (
          <div className={`${styles.notificationToast} ${notification.type === 'success' ? styles.success : styles.error}`}>
            {notification.type === 'success' ? (
              <CheckCircle className={styles.notificationToastIcon} />
            ) : (
              <AlertCircle className={styles.notificationToastIcon} />
            )}
            <p className={styles.notificationToastMessage}>{notification.message}</p>
          </div>
        )}

        {/* Header Card */}
        <div className={styles.settingsHeader}>
          <div className={styles.settingsHeaderContent}>
            <div className={styles.settingsHeaderIcon}>
              <Shield style={{ width: '2rem', height: '2rem', color: '#4f46e5' }} />
            </div>
            <div>
              <h1 className={styles.settingsHeaderTitle}>Account Settings</h1>
              <p className={styles.settingsHeaderSubtitle}>Manage your security and preferences</p>
            </div>
          </div>
        </div>

        {/* Main Settings Card */}
        <div className={styles.settingsCard}>
          
          {/* Account Information */}
          <div className={styles.accountInfoSection}>
            <div className={styles.sectionHeader}>
              <User className={styles.sectionHeaderIcon} />
              <h2 className={styles.sectionTitle}>Account Information</h2>
            </div>
            
            <div className={styles.accountInfoGrid}>
              <div className={styles.infoCard}>
                <label className={styles.infoCardLabel}>Student ID</label>
                <div className={styles.infoCardContent}>
                  <div className={`${styles.infoCardIconWrapper} ${styles.indigo}`}>
                    <User style={{ width: '1rem', height: '1rem', color: '#4f46e5' }} />
                  </div>
                  <p className={styles.infoCardValue}>{student_id}</p>
                </div>
              </div>
              
              <div className={styles.infoCard}>
                <label className={styles.infoCardLabel}>Current Email</label>
                <div className={styles.infoCardContent}>
                  <div className={`${styles.infoCardIconWrapper} ${styles.blue}`}>
                    <Mail style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                  </div>
                  <p className={styles.infoCardValue}>{formData.currentEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              onClick={() => setActiveSection('email')}
              className={`${styles.tabButton} ${activeSection === 'email' ? styles.active : ''}`}
            >
              <div className={styles.tabButtonContent}>
                <Mail style={{ width: '1rem', height: '1rem' }} />
                Change Email
              </div>
            </button>
            <button
              onClick={() => setActiveSection('password')}
              className={`${styles.tabButton} ${activeSection === 'password' ? styles.active : ''}`}
            >
              <div className={styles.tabButtonContent}>
                <Lock style={{ width: '1rem', height: '1rem' }} />
                Change Password
              </div>
            </button>
          </div>

          {/* Email Change Section */}
          {activeSection === 'email' && (
            <div className={`${styles.formSection} ${styles.email}`}>
              <div className={styles.sectionHeader}>
                <Mail style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                <div>
                  <h2 className={styles.sectionTitle}>Email Settings</h2>
                  <p className={styles.sectionSubtitle}>Update your email address for account access</p>
                </div>
              </div>

              <div className={styles.alertBox}>
                <div className={styles.alertBoxContent}>
                  <AlertCircle className={styles.alertBoxIcon} />
                  <div className={styles.alertBoxText}>
                    <p className={styles.alertBoxTitle}>Important:</p>
                    <p>You'll need to verify your new email address. A verification link will be sent to your new email.</p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="currentEmail" className={styles.formLabel}>
                  Current Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="currentEmail"
                    type="email"
                    value={formData.currentEmail}
                    disabled
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newEmail" className={styles.formLabel}>
                  New Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="newEmail"
                    type="email"
                    name="newEmail"
                    value={formData.newEmail}
                    onChange={handleChange}
                    placeholder="Enter your new email address"
                    className={styles.formInput}
                  />
                </div>
                {formData.newEmail && !isValidEmail(formData.newEmail) && (
                  <p className={`${styles.validationMessage} ${styles.error}`}>
                    <AlertCircle className={styles.validationIcon} />
                    Please enter a valid email address
                  </p>
                )}
                {formData.newEmail && isValidEmail(formData.newEmail) && (
                  <p className={`${styles.validationMessage} ${styles.success}`}>
                    <CheckCircle className={styles.validationIcon} />
                    Valid email format
                  </p>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={handleEmailSubmit}
                  disabled={loading || !formData.newEmail || !isValidEmail(formData.newEmail) || formData.newEmail === formData.currentEmail}
                  className={`${styles.submitButton} ${styles.blue}`}
                >
                  {loading ? (
                    <>
                      <div className={styles.loadingSpinner}></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className={styles.submitButtonIcon} />
                      Update Email
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Password Section */}
          {activeSection === 'password' && (
            <div className={`${styles.formSection} ${styles.password}`}>
              <div className={styles.sectionHeader}>
                <Lock style={{ width: '1.25rem', height: '1.25rem', color: '#4f46e5' }} />
                <div>
                  <h2 className={styles.sectionTitle}>Security Settings</h2>
                  <p className={styles.sectionSubtitle}>Update your password to keep your account secure</p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>
                  New Password
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    className={`${styles.formInput} ${styles.withIcon}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                  >
                    {showPassword ? <EyeOff className={styles.passwordToggleIcon} /> : <Eye className={styles.passwordToggleIcon} />}
                  </button>
                </div>
                
                {formData.password && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.passwordStrengthHeader}>
                      <span className={styles.passwordStrengthLabel}>Password Strength:</span>
                      <span className={`${styles.passwordStrengthText} ${styles[getStrengthClass()]}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className={styles.passwordStrengthBar}>
                      <div 
                        className={`${styles.passwordStrengthFill} ${styles[passwordStrength.color]}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <ul className={styles.passwordRequirements}>
                      <li className={`${styles.passwordRequirement} ${formData.password.length >= 8 ? styles.met : ''}`}>
                        {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                      </li>
                      <li className={`${styles.passwordRequirement} ${/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? styles.met : ''}`}>
                        {/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? '✓' : '○'} Upper and lowercase letters
                      </li>
                      <li className={`${styles.passwordRequirement} ${/\d/.test(formData.password) ? styles.met : ''}`}>
                        {/\d/.test(formData.password) ? '✓' : '○'} At least one number
                      </li>
                      <li className={`${styles.passwordRequirement} ${/[^a-zA-Z0-9]/.test(formData.password) ? styles.met : ''}`}>
                        {/[^a-zA-Z0-9]/.test(formData.password) ? '✓' : '○'} Special character (!, @, #, etc.)
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>
                  Confirm New Password
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    className={`${styles.formInput} ${styles.withIcon}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.passwordToggle}
                  >
                    {showConfirmPassword ? <EyeOff className={styles.passwordToggleIcon} /> : <Eye className={styles.passwordToggleIcon} />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className={`${styles.validationMessage} ${styles.error}`}>
                    <AlertCircle className={styles.validationIcon} />
                    Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className={`${styles.validationMessage} ${styles.success}`}>
                    <CheckCircle className={styles.validationIcon} />
                    Passwords match
                  </p>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={loading || !formData.password || formData.password !== formData.confirmPassword}
                  className={`${styles.submitButton} ${styles.primary}`}
                >
                  {loading ? (
                    <>
                      <div className={styles.loadingSpinner}></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className={styles.submitButtonIcon} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          <div className={`${styles.formSection} ${styles.notifications}`}>
            <div className={styles.sectionHeader}>
              <Bell style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} />
              <div>
                <h2 className={styles.sectionTitle}>Notification Preferences</h2>
                <p className={styles.sectionSubtitle}>Manage how you receive updates</p>
              </div>
            </div>

            <div className={styles.notificationToggleCard}>
              <div className={styles.notificationToggleContent}>
                <input
                  id="notifications"
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleChange}
                  className={styles.notificationCheckbox}
                />
                <div style={{ flex: 1 }}>
                  <label htmlFor="notifications" className={styles.notificationLabel}>
                    Email Notifications
                  </label>
                  <p className={styles.notificationDescription}>
                    Receive email notifications for course updates, announcements, and important deadlines
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                onClick={handleNotificationSubmit}
                disabled={loading}
                className={`${styles.submitButton} ${styles.amber}`}
              >
                {loading ? (
                  <>
                    <div className={styles.loadingSpinner}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className={styles.submitButtonIcon} />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Tips Card */}
        <div className={styles.securityTips}>
          <div className={styles.securityTipsContent}>
            <Shield className={styles.securityTipsIcon} />
            <div>
              <h3 className={styles.securityTipsTitle}>Security Tips</h3>
              <ul className={styles.securityTipsList}>
                <li className={styles.securityTipsItem}>• Use a unique password you don't use anywhere else</li>
                <li className={styles.securityTipsItem}>• Keep your email address up to date for account recovery</li>
                <li className={styles.securityTipsItem}>• Never share your password with anyone</li>
                <li className={styles.securityTipsItem}>• Change your password regularly (every 3-6 months)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;