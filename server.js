const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Ensure directories exist
const directories = ['public/uploads', 'public/assets/images', 'public/assets/icons', 'public/css', 'public/js', 'backups'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ✅ FIXED: Separate upload configuration for database files
const backupStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'backups/');
  },
  filename: function (req, file, cb) {
    cb(null, 'uploaded_backup_' + Date.now() + '.db');
  }
});

const backupUpload = multer({ 
  storage: backupStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for database files
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Only .db files are allowed!'), false);
    }
  }
});

// ✅ FIXED: Database initialization with let instead of const
let db = new sqlite3.Database('./cyber_Hexor.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  console.log('🔄 Initializing database tables...');
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      phone TEXT,
      position TEXT,
      profile_pic TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      service TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      updated_at DATETIME
    )`,

    `CREATE TABLE IF NOT EXISTS get_in_touch_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      service TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      updated_at DATETIME
    )`,

    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS team_chat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,

    // ✅ FIXED: Session management table - REMOVED last_activity column
    `CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  ];

  let completed = 0;
  
  function createNextTable() {
    if (completed >= tables.length) {
      console.log('✅ All tables created successfully');
      insertDefaultData();
      return;
    }

    db.run(tables[completed], function(err) {
      if (err) {
        console.error(`❌ Error creating table ${completed + 1}:`, err.message);
      } else {
        console.log(`✅ Table ${completed + 1} created/verified`);
      }
      completed++;
      setTimeout(createNextTable, 100);
    });
  }

  createNextTable();
}

function insertDefaultData() {
  console.log('🔄 Inserting default data...');
  
  const adminPassword = bcrypt.hashSync('admin12345', 10);
  
  // Create admin user
  const adminEmail = 'admin@cyberHexor.com';
  
  db.get("SELECT * FROM users WHERE email = ?", [adminEmail], (err, user) => {
    if (err) {
      console.error('Error checking admin user:', err);
      setTimeout(() => insertDefaultData(), 1000);
      return;
    }
    
    if (!user) {
      db.run(
        "INSERT INTO users (name, email, password, role, position) VALUES (?, ?, ?, ?, ?)",
        ['Admin User', adminEmail, adminPassword, 'admin', 'System Administrator'],
        function(err) {
          if (err) {
            console.error('❌ Error creating admin user:', err);
          } else {
            console.log('✅ Default admin user created');
            console.log('🔐 Admin Login:', adminEmail, '/ admin12345');
            
            // Log activity
            db.run(
              "INSERT INTO activity_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)",
              [this.lastID, 'System', 'system_init', 'Database initialized with default admin user']
            );
          }
        }
      );
    } else {
      console.log('✅ Admin user already exists');
      console.log('🔐 Admin Login:', adminEmail, '/ admin12345');
    }
  });

  // Insert default services
  const defaultServices = [
    {
      name: "SOC Analysis",
      description: "24/7 Security Operations Center monitoring and analysis to detect and respond to threats in real-time.",
      category: "cybersecurity",
      icon: "fas fa-shield-alt"
    },
    {
      name: "Penetration Testing",
      description: "Comprehensive security testing to identify vulnerabilities in your systems, applications and networks.",
      category: "cybersecurity",
      icon: "fas fa-bug"
    },
    {
      name: "Security Audit",
      description: "Thorough security assessment and compliance auditing for your organization's infrastructure and processes.",
      category: "cybersecurity",
      icon: "fas fa-clipboard-check"
    }
  ];

  defaultServices.forEach((service, index) => {
    setTimeout(() => {
      db.get("SELECT * FROM services WHERE name = ?", [service.name], (err, row) => {
        if (!row) {
          db.run(
            "INSERT INTO services (name, description, category, icon) VALUES (?, ?, ?, ?)",
            [service.name, service.description, service.category, service.icon],
            function(err) {
              if (err) {
                console.error('Error creating service:', service.name, err);
              } else {
                console.log(`✅ Service created: ${service.name}`);
              }
            }
          );
        }
      });
    }, index * 200);
  });
}

// Activity logging function
function logActivity(userId, userName, action, details, req = null) {
  const ip = req ? req.ip || req.connection.remoteAddress : '127.0.0.1';
  const userAgent = req ? req.get('User-Agent') : 'System';
  
  db.run(
    "INSERT INTO activity_logs (user_id, user_name, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, userName, action, details, ip, userAgent],
    (err) => {
      if (err) {
        console.error('Error logging activity:', err);
      }
    }
  );
}

// ✅ FIXED: Session management functions - REMOVED last_activity
function generateSessionToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

function createUserSession(userId, req) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const ip = req ? req.ip || req.connection.remoteAddress : '127.0.0.1';
  const userAgent = req ? req.get('User-Agent') : 'Unknown';
  
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)",
      [userId, sessionToken, ip, userAgent, expiresAt.toISOString()],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(sessionToken);
        }
      }
    );
  });
}

// ✅ FIXED: Session validation - REMOVED last_activity update
function validateSession(sessionToken) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT us.*, u.name, u.email, u.role, u.is_active, u.profile_pic, u.position, u.phone
      FROM user_sessions us 
      JOIN users u ON us.user_id = u.id 
      WHERE us.session_token = ? AND us.is_active = 1 AND us.expires_at > datetime('now') AND u.is_active = 1
    `;
    
    db.get(query, [sessionToken], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        resolve(null);
      } else {
        resolve(row);
      }
    });
  });
}

function deleteSession(sessionToken) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE user_sessions SET is_active = 0 WHERE session_token = ?",
      [sessionToken],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

// ✅ FIXED: Clean up expired sessions periodically
function cleanupExpiredSessions() {
  const query = "DELETE FROM user_sessions WHERE expires_at < datetime('now')";
  db.run(query, (err) => {
    if (err) {
      console.error('Error cleaning expired sessions:', err);
    } else {
      console.log('🧹 Expired sessions cleaned up');
    }
  });
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// ✅ FIXED: Authentication middleware
function authenticate(req, res, next) {
  const sessionToken = req.headers['session-token'];

  if (!sessionToken) {
    return res.status(401).json({ 
      success: false, 
      message: 'Session expired. Please login again.',
      sessionExpired: true 
    });
  }

  validateSession(sessionToken)
    .then(session => {
      if (!session) {
        return res.status(401).json({ 
          success: false, 
          message: 'Session expired. Please login again.',
          sessionExpired: true 
        });
      }

      req.user = {
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: session.role,
        profile_pic: session.profile_pic,
        position: session.position,
        phone: session.phone,
        is_active: session.is_active
      };
      req.session = session;
      next();
    })
    .catch(err => {
      console.error('Session validation error:', err);
      res.status(500).json({ success: false, message: 'Authentication error' });
    });
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

// Routes

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ FIXED: Serve secure admin panel - AUTO REDIRECT BASED ON AUTH
app.get('/s5s5a8hhhjdhhjdjadmin', (req, res) => {
  const adminPath = path.join(__dirname, 's5s5a8hhhjdhhjdjadmin.html');
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Admin panel not found.');
  }
});

// Remove old admin route
app.get('/admin', (req, res) => {
  res.status(404).send('Page not found');
});

// API Routes

// ✅ FIXED: Login API
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt for:', email);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.is_active === 0) {
      console.log('Login failed: User account deactivated');
      return res.status(401).json({ success: false, message: 'Account deactivated. Please contact administrator.' });
    }

    if (bcrypt.compareSync(password, user.password)) {
      // Update last login
      db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
      
      // Create session
      createUserSession(user.id, req)
        .then(sessionToken => {
          // Log activity
          logActivity(user.id, user.name, 'login', 'User logged into admin panel', req);

          console.log('✅ Login successful for user:', user.email);
          res.json({ 
            success: true, 
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              profile_pic: user.profile_pic,
              position: user.position,
              phone: user.phone,
              is_active: user.is_active
            },
            sessionToken: sessionToken,
            sessionExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        })
        .catch(sessionErr => {
          console.error('Session creation error:', sessionErr);
          res.status(500).json({ success: false, message: 'Login failed due to session error' });
        });
    } else {
      console.log('Login failed: Invalid password');
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// ✅ FIXED: Logout API
app.post('/api/logout', (req, res) => {
  const sessionToken = req.headers['session-token'];
  
  if (sessionToken) {
    deleteSession(sessionToken)
      .then(() => {
        console.log('✅ Session deleted successfully');
        res.json({ success: true, message: 'Logged out successfully' });
      })
      .catch(err => {
        console.error('Logout error:', err);
        res.json({ success: true, message: 'Logged out successfully' });
      });
  } else {
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

// ✅ FIXED: Validate session API
app.get('/api/validate-session', authenticate, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user,
    valid: true 
  });
});

// ... rest of the API routes remain the same as your previous working version ...

// Users management
app.get('/api/users', authenticate, requireAdmin, (req, res) => {
  db.all("SELECT id, name, email, role, phone, position, profile_pic, is_active, created_at, last_login FROM users ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      res.json({ success: true, users: rows });
    }
  });
});

// Get single user
app.get('/api/users/:id', authenticate, (req, res) => {
  const userId = req.params.id;

  // Users can only view their own profile, admins can view any
  if (req.user.role !== 'admin' && userId != req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  db.get("SELECT id, name, email, role, phone, position, profile_pic, is_active, created_at, last_login FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else if (!row) {
      res.status(404).json({ success: false, message: 'User not found' });
    } else {
      res.json({ success: true, user: row });
    }
  });
});

app.post('/api/users', authenticate, requireAdmin, (req, res) => {
  const { name, email, password, role, phone, position } = req.body;

  console.log('Creating user:', email);

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (name, email, password, role, phone, position) VALUES (?, ?, ?, ?, ?, ?)",
    [name, email, hashedPassword, role, phone, position],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(400).json({ success: false, message: 'User already exists' });
        } else {
          console.error('Error creating user:', err);
          res.status(500).json({ success: false, message: 'Database error' });
        }
      } else {
        // Log activity
        logActivity(req.user.id, req.user.name, 'create_user', `Created user: ${email} with role: ${role}`, req);

        res.json({ success: true, message: 'User created successfully', userId: this.lastID });
      }
    }
  );
});

app.put('/api/users/:id', authenticate, (req, res) => {
  const userId = req.params.id;
  const { name, phone, position, role } = req.body;

  // Users can only update their own profile, admins can update any
  if (req.user.role !== 'admin' && userId != req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only update your own profile' });
  }

  // Only admins can change roles
  const updateQuery = req.user.role === 'admin' 
    ? "UPDATE users SET name = ?, phone = ?, position = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    : "UPDATE users SET name = ?, phone = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  
  const params = req.user.role === 'admin' 
    ? [name, phone, position, role, userId]
    : [name, phone, position, userId];

  db.run(updateQuery, params, function(err) {
    if (err) {
      console.error('Error updating user:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      // Log activity
      logActivity(req.user.id, req.user.name, 'update_user', `Updated user: ${userId}`, req);

      res.json({ success: true, message: 'User updated successfully' });
    }
  });
});

// FIXED: Change user password (admin only)
app.put('/api/users/:id/password', authenticate, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { new_password } = req.body;

  console.log('🔐 Password change request for user:', userId);

  if (!new_password) {
    console.log('❌ Password change failed: No password provided');
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  if (new_password.length < 6) {
    console.log('❌ Password change failed: Password too short');
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const hashedPassword = bcrypt.hashSync(new_password, 10);

  console.log('🔑 Password hashed successfully');

  db.run(
    "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [hashedPassword, userId],
    function(err) {
      if (err) {
        console.error('❌ Error updating password in database:', err);
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
      } else {
        if (this.changes === 0) {
          console.log('❌ Password change failed: User not found');
          res.status(404).json({ success: false, message: 'User not found' });
        } else {
          console.log('✅ Password changed successfully for user:', userId);
          // Log activity
          logActivity(req.user.id, req.user.name, 'change_user_password', `Changed password for user: ${userId}`, req);

          res.json({ success: true, message: 'Password updated successfully' });
        }
      }
    }
  );
});

// Toggle user status (active/inactive)
app.put('/api/users/:id/status', authenticate, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { is_active } = req.body;

  // Prevent deactivating own account
  if (userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
  }

  db.run(
    "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [is_active, userId],
    function(err) {
      if (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        // Log activity
        const statusText = is_active ? 'activated' : 'deactivated';
        logActivity(req.user.id, req.user.name, 'update_user_status', `${statusText} user: ${userId}`, req);

        res.json({ success: true, message: `User ${statusText} successfully` });
      }
    }
  );
});

app.delete('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  const userId = req.params.id;

  // Prevent deleting own account
  if (userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }

  db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
    if (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      // Log activity
      logActivity(req.user.id, req.user.name, 'delete_user', `Deleted user: ${userId}`, req);

      res.json({ success: true, message: 'User deleted successfully' });
    }
  });
});

// Profile picture upload - ADMIN CAN UPLOAD FOR ANY USER
app.post('/api/upload-profile-pic', authenticate, upload.single('profile_pic'), (req, res) => {
  const userId = req.body.user_id;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Check if admin or user uploading their own picture
  if (req.user.role !== 'admin' && userId != req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only update your own profile picture' });
  }

  const profilePicPath = '/uploads/' + req.file.filename;

  db.run(
    "UPDATE users SET profile_pic = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [profilePicPath, userId],
    function(err) {
      if (err) {
        console.error('Error updating profile picture:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        // Log activity
        const actionText = req.user.role === 'admin' && userId != req.user.id ? 
          `Updated profile picture for user: ${userId}` : 'Updated profile picture';
        logActivity(req.user.id, req.user.name, 'update_profile_pic', actionText, req);

        res.json({ success: true, profile_pic: profilePicPath });
      }
    }
  );
});

// Profile update
app.put('/api/users/:id/profile', authenticate, (req, res) => {
  const userId = req.params.id;
  const { name, phone, position } = req.body;

  // Users can only update their own profile, admins can update any
  if (req.user.role !== 'admin' && userId != req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only update your own profile' });
  }

  db.run(
    "UPDATE users SET name = ?, phone = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, phone, position, userId],
    function(err) {
      if (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        res.json({ success: true, message: 'Profile updated successfully' });
      }
    }
  );
});

// Services management - PUBLIC (no auth required for viewing)
app.get('/api/services', (req, res) => {
  db.all("SELECT * FROM services ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error('Error fetching services:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      res.json({ success: true, services: rows });
    }
  });
});

// Get single service - PUBLIC
app.get('/api/services/:id', (req, res) => {
  const serviceId = req.params.id;

  db.get("SELECT * FROM services WHERE id = ?", [serviceId], (err, row) => {
    if (err) {
      console.error('Error fetching service:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else if (!row) {
      res.status(404).json({ success: false, message: 'Service not found' });
    } else {
      res.json({ success: true, service: row });
    }
  });
});

// Services management (create, update, delete) - AUTH REQUIRED
app.post('/api/services', authenticate, requireAdmin, (req, res) => {
  const { name, description, category, icon } = req.body;

  console.log('Creating service:', name);

  db.run(
    "INSERT INTO services (name, description, category, icon) VALUES (?, ?, ?, ?)",
    [name, description, category, icon],
    function(err) {
      if (err) {
        console.error('Error creating service:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        // Log activity
        logActivity(req.user.id, req.user.name, 'create_service', `Created service: ${name}`, req);

        res.json({ success: true, message: 'Service created successfully', serviceId: this.lastID });
      }
    }
  );
});

app.put('/api/services/:id', authenticate, requireAdmin, (req, res) => {
  const serviceId = req.params.id;
  const { name, description, category, icon, is_active } = req.body;

  db.run(
    "UPDATE services SET name = ?, description = ?, category = ?, icon = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, description, category, icon, is_active, serviceId],
    function(err) {
      if (err) {
        console.error('Error updating service:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        res.json({ success: true, message: 'Service updated successfully' });
      }
    }
  );
});

app.delete('/api/services/:id', authenticate, requireAdmin, (req, res) => {
  const serviceId = req.params.id;

  db.run("DELETE FROM services WHERE id = ?", [serviceId], function(err) {
    if (err) {
      console.error('Error deleting service:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      // Log activity
      logActivity(req.user.id, req.user.name, 'delete_service', `Deleted service: ${serviceId}`, req);

      res.json({ success: true, message: 'Service deleted successfully' });
    }
  });
});

// Contact form submissions - PUBLIC
app.post('/api/contact', (req, res) => {
  const { name, email, company, service, message } = req.body;

  console.log('Contact form submission from:', email);

  db.run(
    "INSERT INTO contact_submissions (name, email, company, service, message) VALUES (?, ?, ?, ?, ?)",
    [name, email, company, service, message],
    function(err) {
      if (err) {
        console.error('Error saving contact:', err);
        res.status(500).json({ success: false, message: 'Failed to send message' });
      } else {
        console.log('Contact form saved successfully');
        res.json({ success: true, message: 'Message sent successfully!' });
      }
    }
  );
});

// Contact submissions management - AUTH REQUIRED
app.get('/api/contact-submissions', authenticate, (req, res) => {
  const query = `
    SELECT cs.*, u.name as updated_by_name 
    FROM contact_submissions cs 
    LEFT JOIN users u ON cs.updated_by = u.id 
    ORDER BY cs.submitted_at DESC
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching contact submissions:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      res.json({ success: true, submissions: rows });
    }
  });
});

// Get specific contact message - AUTH REQUIRED
app.get('/api/contact-submissions/:id', authenticate, (req, res) => {
  const submissionId = req.params.id;

  const query = `
    SELECT cs.*, u.name as updated_by_name 
    FROM contact_submissions cs 
    LEFT JOIN users u ON cs.updated_by = u.id 
    WHERE cs.id = ?
  `;

  db.get(query, [submissionId], (err, row) => {
    if (err) {
      console.error('Error fetching contact submission:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else if (!row) {
      res.status(404).json({ success: false, message: 'Message not found' });
    } else {
      res.json({ success: true, submission: row });
    }
  });
});

// Update message status - AUTH REQUIRED
app.put('/api/contact-submissions/:id/status', authenticate, (req, res) => {
  const submissionId = req.params.id;
  const { status } = req.body;

  db.run(
    "UPDATE contact_submissions SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, req.user.id, submissionId],
    function(err) {
      if (err) {
        console.error('Error updating contact status:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        // Log activity
        logActivity(req.user.id, req.user.name, 'update_message_status', `Updated contact message ${submissionId} to ${status}`, req);

        res.json({ success: true, message: 'Status updated successfully' });
      }
    }
  );
});

// Get in touch submissions - PUBLIC
app.post('/api/get-in-touch', (req, res) => {
  const { name, email, company, service, message } = req.body;

  console.log('Get in touch submission from:', email);

  db.run(
    "INSERT INTO get_in_touch_submissions (name, email, company, service, message) VALUES (?, ?, ?, ?, ?)",
    [name, email, company, service, message],
    function(err) {
      if (err) {
        console.error('Error saving get in touch:', err);
        res.status(500).json({ success: false, message: 'Failed to send message' });
      } else {
        console.log('Get in touch form saved successfully');
        res.json({ success: true, message: 'Message sent successfully!' });
      }
    }
  );
});

// Get in touch submissions management - AUTH REQUIRED
app.get('/api/get-in-touch-submissions', authenticate, (req, res) => {
  const query = `
    SELECT gs.*, u.name as updated_by_name 
    FROM get_in_touch_submissions gs 
    LEFT JOIN users u ON gs.updated_by = u.id 
    ORDER BY gs.submitted_at DESC
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching get in touch submissions:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      res.json({ success: true, submissions: rows });
    }
  });
});

// Get specific get in touch message - AUTH REQUIRED
app.get('/api/get-in-touch-submissions/:id', authenticate, (req, res) => {
  const submissionId = req.params.id;

  const query = `
    SELECT gs.*, u.name as updated_by_name 
    FROM get_in_touch_submissions gs 
    LEFT JOIN users u ON gs.updated_by = u.id 
    WHERE gs.id = ?
  `;

  db.get(query, [submissionId], (err, row) => {
    if (err) {
      console.error('Error fetching get in touch submission:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else if (!row) {
      res.status(404).json({ success: false, message: 'Message not found' });
    } else {
      res.json({ success: true, submission: row });
    }
  });
});

// Update get in touch message status - AUTH REQUIRED
app.put('/api/get-in-touch-submissions/:id/status', authenticate, (req, res) => {
  const submissionId = req.params.id;
  const { status } = req.body;

  db.run(
    "UPDATE get_in_touch_submissions SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, req.user.id, submissionId],
    function(err) {
      if (err) {
        console.error('Error updating get in touch status:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        // Log activity
        logActivity(req.user.id, req.user.name, 'update_message_status', `Updated get in touch message ${submissionId} to ${status}`, req);

        res.json({ success: true, message: 'Status updated successfully' });
      }
    }
  );
});

// Activity logs - AUTH REQUIRED
app.get('/api/activity-logs', authenticate, (req, res) => {
  const limit = req.query.limit || 100;

  // Regular users can only see their own activities
  const query = req.user.role === 'admin' 
    ? `SELECT al.*, u.name as user_name, u.email as user_email 
       FROM activity_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       ORDER BY al.created_at DESC
       LIMIT ?`
    : `SELECT al.*, u.name as user_name, u.email as user_email 
       FROM activity_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       WHERE al.user_id = ?
       ORDER BY al.created_at DESC
       LIMIT ?`;

  const params = req.user.role === 'admin' ? [limit] : [req.user.id, limit];

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching activity logs:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      res.json({ success: true, logs: rows });
    }
  });
});

// Team Chat - AUTH REQUIRED
app.get('/api/team-chat', authenticate, (req, res) => {
  const query = `
    SELECT tc.*, u.name as user_name, u.role as user_role 
    FROM team_chat tc 
    LEFT JOIN users u ON tc.user_id = u.id 
    ORDER BY tc.created_at ASC
    LIMIT 100
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching team chat:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    } else {
      res.json({ success: true, messages: rows });
    }
  });
});

app.post('/api/team-chat', authenticate, (req, res) => {
  const { user_id, user_name, user_role, message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message cannot be empty' });
  }

  db.run(
    "INSERT INTO team_chat (user_id, user_name, user_role, message) VALUES (?, ?, ?, ?)",
    [user_id, user_name, user_role, message.trim()],
    function(err) {
      if (err) {
        console.error('Error saving team chat message:', err);
        res.status(500).json({ success: false, message: 'Database error' });
      } else {
        res.json({ success: true, message: 'Message sent successfully' });
      }
    }
  );
});

// Dashboard statistics - AUTH REQUIRED
app.get('/api/dashboard-stats', authenticate, (req, res) => {
  const queries = {
    totalUsers: req.user.role === 'admin' ? "SELECT COUNT(*) as count FROM users" : "SELECT 0 as count",
    totalServices: "SELECT COUNT(*) as count FROM services WHERE is_active = 1",
    newContactMessages: "SELECT COUNT(*) as count FROM contact_submissions WHERE status = 'new'",
    newGetInTouchMessages: "SELECT COUNT(*) as count FROM get_in_touch_submissions WHERE status = 'new'",
    totalActivityLogs: req.user.role === 'admin' 
      ? "SELECT COUNT(*) as count FROM activity_logs" 
      : "SELECT COUNT(*) as count FROM activity_logs WHERE user_id = ?"
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    const params = (key === 'totalActivityLogs' && req.user.role !== 'admin') ? [req.user.id] : [];
    
    db.get(query, params, (err, row) => {
      if (err) {
        console.error(`Error fetching ${key}:`, err);
        results[key] = 0;
      } else {
        results[key] = row.count;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json({ success: true, stats: results });
      }
    });
  });
});

// Database backup - AUTH REQUIRED
app.get('/api/backup', authenticate, requireAdmin, (req, res) => {
  const backupFileName = `cyber_Hexor_backup_${Date.now()}.db`;
  const backupPath = path.join(__dirname, 'backups', backupFileName);
  
  console.log('💾 Starting database backup...');
  
  // Ensure backups directory exists
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }
  
  // Use VACUUM INTO for backup
  db.run(`VACUUM INTO '${backupPath}'`, function(err) {
    if (err) {
      console.error('❌ Backup error:', err);
      return res.status(500).json({ success: false, message: 'Backup failed: ' + err.message });
    }
    
    // Verify backup file was created and has data
    setTimeout(() => {
      try {
        if (!fs.existsSync(backupPath)) {
          console.error('❌ Backup file not created');
          return res.status(500).json({ success: false, message: 'Backup file was not created' });
        }
        
        const stats = fs.statSync(backupPath);
        if (stats.size === 0) {
          console.error('❌ Backup file is empty');
          fs.unlinkSync(backupPath);
          return res.status(500).json({ success: false, message: 'Backup file is empty' });
        }
        
        console.log('✅ Backup created successfully:', backupPath, 'Size:', stats.size, 'bytes');
        
        // Verify backup contains tables
        const backupDb = new sqlite3.Database(backupPath);
        backupDb.all("SELECT name FROM sqlite_master WHERE type='table'", (tableErr, tables) => {
          if (tableErr) {
            console.error('❌ Error verifying backup tables:', tableErr);
          } else {
            console.log('✅ Backup contains tables:', tables.map(t => t.name).join(', '));
          }
          
          backupDb.close();
          
          // Log activity
          logActivity(req.user.id, req.user.name, 'database_backup', 'Created database backup', req);

          // Send file for download
          res.download(backupPath, backupFileName, (downloadErr) => {
            if (downloadErr) {
              console.error('❌ Error downloading backup:', downloadErr);
            } else {
              console.log('✅ Backup downloaded successfully');
            }
            
            // Clean up backup file after download (with delay)
            setTimeout(() => {
              if (fs.existsSync(backupPath)) {
                try {
                  fs.unlinkSync(backupPath);
                  console.log('🧹 Temporary backup file cleaned up');
                } catch (cleanupErr) {
                  console.error('⚠️ Error cleaning up backup file:', cleanupErr);
                }
              }
            }, 30000); // Keep for 30 seconds in case download fails
          });
        });
        
      } catch (fileErr) {
        console.error('❌ Error verifying backup file:', fileErr);
        res.status(500).json({ success: false, message: 'Error verifying backup file' });
      }
    }, 500);
  });
});

// Database restore - AUTH REQUIRED
app.post('/api/restore', authenticate, requireAdmin, backupUpload.single('backup_file'), (req, res) => {
    console.log('🔄 Starting database restore process...');
    
    if (!req.file) {
        console.log('❌ No backup file provided');
        return res.status(400).json({ success: false, message: 'No backup file provided' });
    }

    const uploadedBackupPath = req.file.path;
    const currentDbPath = './cyber_Hexor.db';
    const safetyBackupPath = path.join(__dirname, 'backups', `safety_backup_${Date.now()}.db`);

    console.log('📁 Backup file uploaded:', uploadedBackupPath);

    // Store current user info before restore
    const currentUser = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    };

    console.log('👤 Current user stored for auto-login:', currentUser.email);

    // Step 1: Verify the uploaded backup file
    console.log('🔍 Verifying backup file...');
    try {
        const testDb = new sqlite3.Database(uploadedBackupPath, sqlite3.OPEN_READONLY);
        
        testDb.all("SELECT name FROM sqlite_master WHERE type='table'", (verifyErr, tables) => {
            if (verifyErr || !tables || tables.length === 0) {
                console.error('❌ Invalid backup file - no tables found:', verifyErr);
                testDb.close();
                fs.unlinkSync(uploadedBackupPath);
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid database file: No tables found or corrupted database' 
                });
            }

            console.log('✅ Backup file verified - contains tables:', tables.map(t => t.name).join(', '));
            testDb.close((closeErr) => {
                if (closeErr) console.error('Warning closing test DB:', closeErr);
                proceedWithRestore();
            });
        });
    } catch (error) {
        console.error('❌ Error verifying backup:', error);
        if (fs.existsSync(uploadedBackupPath)) fs.unlinkSync(uploadedBackupPath);
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid backup file: ' + error.message 
        });
    }

    function proceedWithRestore() {
        // Step 2: Create safety backup of current database
        console.log('💾 Creating safety backup of current database...');
        try {
            if (fs.existsSync(currentDbPath)) {
                fs.copyFileSync(currentDbPath, safetyBackupPath);
                console.log('✅ Safety backup created:', safetyBackupPath);
            }
        } catch (backupErr) {
            console.error('❌ Error creating safety backup:', backupErr);
            fs.unlinkSync(uploadedBackupPath);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to create safety backup before restore' 
            });
        }

        // Step 3: Close current database connection
        console.log('🔒 Closing current database connection...');
        db.close((closeErr) => {
            if (closeErr) {
                console.error('⚠️ Warning closing DB:', closeErr);
            }

            // Small delay to ensure DB is fully closed
            setTimeout(() => {
                // Step 4: Replace current database with backup
                console.log('🔄 Replacing database file...');
                try {
                    // Remove current database
                    if (fs.existsSync(currentDbPath)) {
                        fs.unlinkSync(currentDbPath);
                    }
                    
                    // Copy uploaded backup to current database location
                    fs.copyFileSync(uploadedBackupPath, currentDbPath);
                    
                    // Clean up uploaded file
                    fs.unlinkSync(uploadedBackupPath);
                    
                    console.log('✅ Database file replaced successfully');
                    
                } catch (replaceErr) {
                    console.error('❌ Error replacing database:', replaceErr);
                    restoreSafetyBackup();
                    return;
                }

                // Step 5: Reinitialize database connection
                console.log('🔗 Reinitializing database connection...');
                db = new sqlite3.Database(currentDbPath, (newDbErr) => {
                    if (newDbErr) {
                        console.error('❌ Error reopening database:', newDbErr);
                        restoreSafetyBackup();
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Database restored but failed to reconnect' 
                        });
                    }

                    console.log('✅ Database connection reestablished');

                    // Step 6: Verify the restored database works
                    db.all("SELECT name FROM sqlite_master WHERE type='table'", (verifyErr, tables) => {
                        if (verifyErr || !tables) {
                            console.error('❌ Restored database verification failed:', verifyErr);
                            restoreSafetyBackup();
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Restored database is corrupted' 
                            });
                        }

                        console.log('✅ Restored database verified - tables:', tables.map(t => t.name).join(', '));

                        // Verify current user still exists in restored database
                        console.log('🔍 Verifying user exists in restored database...');
                        db.get("SELECT id, name, email, role FROM users WHERE id = ?", [currentUser.id], (userErr, restoredUser) => {
                            if (userErr || !restoredUser) {
                                console.log('⚠️ Current user not found in restored database, checking by email...');
                                
                                // Try to find user by email
                                db.get("SELECT id, name, email, role FROM users WHERE email = ?", [currentUser.email], (emailErr, userByEmail) => {
                                    if (emailErr || !userByEmail) {
                                        console.error('❌ Current user not found in restored database');
                                        restoreSafetyBackup();
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Your user account was not found in the restored database. Original database has been restored.' 
                                        });
                                    }
                                    
                                    // User found by email - update current user info
                                    console.log('✅ User found by email in restored database:', userByEmail.email);
                                    finalizeRestore(userByEmail);
                                });
                            } else {
                                // User found by ID
                                console.log('✅ User found in restored database:', restoredUser.email);
                                finalizeRestore(restoredUser);
                            }
                        });

                        function finalizeRestore(restoredUser) {
                            // Log the activity with restored user info
                            logActivity(restoredUser.id, restoredUser.name, 'database_restore', 'Database restored from backup', req);

                            console.log('🎉 Database restore completed successfully!');

                            // Clean up safety backup after successful restore
                            setTimeout(() => {
                                if (fs.existsSync(safetyBackupPath)) {
                                    try {
                                        fs.unlinkSync(safetyBackupPath);
                                        console.log('🧹 Safety backup cleaned up');
                                    } catch (cleanErr) {
                                        console.error('⚠️ Error cleaning safety backup:', cleanErr);
                                    }
                                }
                            }, 10000);

                            // Return user data for auto-login
                            res.json({ 
                                success: true, 
                                message: 'Database restored successfully! You will remain logged in.',
                                user: {
                                    id: restoredUser.id,
                                    name: restoredUser.name,
                                    email: restoredUser.email,
                                    role: restoredUser.role
                                },
                                tables: tables.map(t => t.name),
                                autoLogin: true
                            });
                        }
                    });
                });
            }, 1000);
        });
    }

    function restoreSafetyBackup() {
        console.log('🔄 Restoring from safety backup...');
        try {
            if (fs.existsSync(safetyBackupPath)) {
                if (fs.existsSync(currentDbPath)) {
                    fs.unlinkSync(currentDbPath);
                }
                fs.copyFileSync(safetyBackupPath, currentDbPath);
                console.log('✅ Safety backup restored');
            }
            
            // Reinitialize database connection
            db = new sqlite3.Database(currentDbPath);
            
            // Clean up
            if (fs.existsSync(uploadedBackupPath)) fs.unlinkSync(uploadedBackupPath);
            
        } catch (restoreErr) {
            console.error('❌ CRITICAL: Failed to restore safety backup:', restoreErr);
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Restore failed. Original database has been restored.' 
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cyber Hexor server running on http://localhost:${PORT}`);
  console.log(`🔐 SECURE Admin panel: http://localhost:${PORT}/s5s5a8hhhjdhhjdjadmin`);
  console.log(`📊 Database: cyber_Hexor.db`);
  console.log(`💾 Backups folder: ./backups/`);
  console.log('\n=== PERSISTENT SESSION MANAGEMENT SYSTEM ===');
  console.log('✅ Session persistence: Browser refresh maintains session');
  console.log('✅ Auto-redirect: Direct to dashboard if logged in');
  console.log('✅ Session expiry: 24 hours');
  console.log('✅ Secure sessions: Database-based session management');
  console.log('==============================================\n');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);

});
