-- Mapping based on assumed Category IDs:
-- 1: Hardware | 2: Network | 3: Software | 4: Printer | 5: Security
-- 6: OS | 7: Email | 8: Power | 9: Data | 10: General

INSERT INTO [dbo].[error_types] ([category_id], [type_name])
VALUES 
-- 1. Hardware Failure
(1, 'Monitor / Display Issue'),
(1, 'Hard Disk Failure / No Boot Device'),
(1, 'Keyboard / Mouse Malfunction'),
(1, 'System Overheating'),
(1, 'RAM / Memory Error (Blue Screen)'),

-- 2. Network & Connectivity
(2, 'No Internet Connection'),
(2, 'Slow Network Speed'),
(2, 'Wi-Fi Connection Issue'),
(2, 'VPN Connection Failed'),
(2, 'Network Drive Disconnected'),

-- 3. Software / Application Issue
(3, 'Application Crashing / Freezing'),
(3, 'License Expired'),
(3, 'Installation / Update Failed'),
(3, 'Software Slow Performance'),
(3, 'Specific Error Message Pop-up'),

-- 4. Printer & Peripheral Device
(4, 'Paper Jam'),
(4, 'Toner Low / Empty'),
(4, 'Printer Offline / Not Printing'),
(4, 'Scanner Not Detected'),
(4, 'Printer Driver Issue'),

-- 5. User Access & Security
(5, 'Password Reset Request'),
(5, 'Account Locked'),
(5, 'Access Denied to File/Folder'),
(5, 'Two-Factor Authentication Issue'),
(5, 'Suspicious Activity / Virus Alert'),

-- 6. Operating System Issue
(6, 'Windows Update Failed'),
(6, 'System Boot Loop / Startup Repair'),
(6, 'Driver Incompatibility'),
(6, 'Corrupted System Files'),

-- 7. Email & Communication
(7, 'Cannot Send / Receive Emails'),
(7, 'Outlook Not Syncing'),
(7, 'Spam / Phishing Report'),

-- 8. Power & Electrical
(8, 'Device Not Powering On'),
(8, 'UPS Battery Failure / Beeping'),
(8, 'Power Cable / Adapter Damaged'),

-- 9. Data & Backup
(9, 'File Recovery Request'),
(9, 'Daily Backup Failed'),
(9, 'Data Corruption'),

-- 10. General Inquiry / Other
(10, 'New Equipment Request'),
(10, 'IT Consultation'),
(10, 'Other (Please Specify in Description)');
GO