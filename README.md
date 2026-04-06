# FormFlow — Google Forms Replica for College

A Google Forms replica built specifically for college instructors and students. Create, distribute, and analyze forms with advanced features like form templates, role-based access, deadline management, and comprehensive response analytics.

## 🎯 Features

### For Faculty/Instructors
- **Create Custom Forms** — Build surveys, quizzes, feedback forms, and questionnaires
- **Multiple Question Types** — Text, textarea, number, email, date, and multiple-choice (MCQ)
- **Form Templates** — Quick-start with 7 pre-built templates:
  - Event Registration
  - Course Evaluation
  - Faculty Feedback Form
  - Quiz / Internal Test
  - Leave Application
  - Lab Feedback
  - Doubt/Query Submission
- **Access Control** — Public forms or department-specific group forms
- **Deadline Management** — Set response deadlines and auto-close expired forms
- **Response Management** — View, filter, and download responses in real-time
- **Report Release** — Control when students can see form results
- **Theme Customization** — Choose theme colors for forms
- **Response Restrictions** — Allow single or multiple responses per student

### For Students
- **Easy Form Access** — Access forms via unique form codes
- **Fill & Submit** — Intuitive interface for completing forms
- **Multi-question Support** — Answer various question types seamlessly
- **Submission Confirmation** — Get confirmation after submission
- **View Results** — See form results when instructor releases reports

### Technical Highlights
- **Oracle Database** — Enterprise-grade SQL backend
- **Advanced Triggers & Procedures** — PL/SQL automation for deadline validation and response tracking
- **Audit Logging** — Track form creation and response submissions
- **JSON Templates** — Efficient template storage using CLOB

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js with Express.js (ES6 modules) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Tailwind CSS |
| **Database** | Oracle SQL (XEPDB1) with PL/SQL |
| **Server** | Express.js (v5.2.1) |
| **Auth** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **ORM/Driver** | oracledb (v6.10.0) |

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v16+ (uses `--env-file` flag)
- [npm](https://www.npmjs.com/) v8+
- [Oracle Database](https://www.oracle.com/database/) (XE, Enterprise, or compatible)
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sagnik0606-ux/formflow.git
cd formflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Oracle Database

**Create/Update `.env` file:**

```env
DB_USER=user
DB_PASSWORD=user_pwd
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XEPDB1
NODE_ENV=development
PORT=8000
JWT_SECRET=your_strong_random_secret_here
```

> **⚠️ Important:** Never commit `.env` to Git. It's already in `.gitignore`. The `JWT_SECRET` must be a long, random string — it signs all authentication tokens.

### 4. Create Database Schema

Run the SQL setup script in your Oracle Database (SQL Developer or SQL*Plus):

```bash
# Via SQL Developer, run project_db.sql entirely
# OR via sqlplus:
sqlplus user/user@XEPDB1 @project_db.sql
```

This creates:
- **8 tables** (users, forms, questions, options, responses, answers, audit_logs, form_templates)
- **4 PL/SQL triggers** (deadline validation, response blocking, audit tracking)
- **2 PL/SQL procedures** (form status toggle, expire forms)
- **1 PL/SQL function** (count responses)
- **7 pre-loaded form templates** (JSON-based)
- **Sample data** (2 users, 2 forms, questions, responses)

### 5. (Optional) Migrate Existing Passwords

If you have existing users with plain-text passwords in the database, run the one-time migration script to hash them without resetting accounts:

```bash
node --env-file=.env migrate_passwords.js
```

### 6. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs at **`http://localhost:8000`**

## 📚 Project Structure

```
formflow/
├── public/
│   ├── signin.html           # Login page (glass-morphism UI)
│   ├── dashboard.html        # Main instructor dashboard
│   ├── auth-helper.js        # Client-side JWT storage & auth header utility
│   ├── newForm.js            # Create/edit forms + template selection
│   ├── myForms.js            # Instructor's form list + management
│   ├── fillForm.js           # Student form-filling interface
│   ├── myResponses.html      # Student view their responses
│   └── audit.js              # Audit log viewer
├── routes/
│   ├── auth.js               # Login/signup/me/change-password endpoints
│   ├── forms.js              # Form CRUD + template endpoints (JWT-protected)
│   └── responses.js          # Response submission + retrieval (JWT-protected)
├── middleware/
│   └── auth.js               # requireAuth JWT verification middleware
├── db.js                     # Oracle connection manager
├── server.js                 # Express app entry point
├── package.json              # Dependencies + scripts
├── project_db.sql            # Full database schema + data
├── migrate_passwords.js      # One-time password hashing migration script
├── tmp_db_update.js          # Migration script (run once)
├── .env                      # Database credentials + JWT secret (NEVER commit)
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## 🔌 API Endpoints

### Authentication

- `POST /auth/login` — User login
  - Body: `{ email, password }`
  - Response: `{ ok: true, token: "<jwt>", redirect: "/dashboard.html" }`

- `POST /auth/signup` — User registration
  - Body: `{ name, email, password, user_type (student|faculty), department, batch? }`

- `GET /auth/me` — Get current user info *(requires JWT)*

- `POST /auth/change-password` — Change own password *(requires JWT)*
  - Body: `{ current_password, new_password }`

> **All protected endpoints require the header:** `Authorization: Bearer <token>`

### Forms

- `POST /forms/create` — Create new form
  - Body: `{ title, description, access_type, target_dept?, deadline, theme_color? }`
  - Response: `{ form_id, form_code }`

- `GET /forms/all` — Get all user's forms
  - Returns: Form list with response counts

- `GET /forms/:formId` — Get form details + questions
  - Returns: Form + questions + options

- `PUT /forms/:formId` — Update form details

- `DELETE /forms/:formId` — Delete form

- `GET /forms/by-code/:code` — Get form by unique code (student access)

- `GET /forms/templates` — Get all form templates

- `POST /forms/from-template` — Create form from template

### Responses

- `POST /responses/submit` — Submit form response
  - Body: `{ form_id, answers: [{ question_id, answer_text|answer_number|option_id }] }`

- `GET /responses/form/:formId` — Get all responses to a form (instructor only)
  - Returns: Aggregate stats + individual responses

- `GET /responses/user/:userId` — Get responses submitted by user (student view)

## 🗄️ Database Schema Overview

### Tables
| Table | Purpose |
|-------|---------|
| `users` | Faculty & student accounts |
| `forms` | Form definitions + metadata |
| `questions` | Form questions with types |
| `options` | MCQ options |
| `responses` | Form submissions (one per student per form) |
| `answers` | Individual answers to questions |
| `form_templates` | JSON-based form templates |
| `audit_logs` | Action tracking (create, submit, etc.) |

### Key Constraints
- Forms cannot have past deadlines (trigger: `trg_form_deadline_check`)
- Responses blocked on expired/closed forms (trigger: `trg_prevent_invalid_response`)
- Auto-populate response counts via function: `fn_get_response_count()`

## 🎨 Frontend Features

### Glass-Morphism UI
- Modern frosted glass design using Tailwind CSS
- DM Sans font family
- Toast notifications (error/success)
- Responsive mobile-first layout

### Sign-In Page
- Email + password authentication
- Sign-up toggle for new users
- Remember-me option (optional)

### Dashboard (Instructor)
- Overview: Total forms, responses pending, active forms
- Create new form or from template
- Manage existing forms (edit, delete, view responses)
- Analytics sidebar

### Form Creation (`newForm.js`)
- Drag-and-drop question reordering
- Add/remove questions dynamically
- Rich question customization (required field, help text)
- Template quick-start
- Live preview

### Form Filling (`fillForm.js`)
- Progressive form rendering
- Type-specific input validation
- Progress indicator
- Submit confirmation

## 🔐 Security

### ✅ Implemented

1. **Password Hashing** — Passwords are hashed with `bcryptjs` (cost factor 12) on signup and verified with `bcrypt.compare()` on login. Plain-text passwords are never stored.
2. **JWT Authentication** — A signed JWT (`userId` + `userType`, 8h expiry) is issued on login and must be sent as a Bearer token on all protected requests.
3. **Auth Middleware** — `middleware/auth.js` verifies the JWT and injects `req.user` on every protected route. The client never supplies a `user_id` directly.
4. **IDOR Protection** — All routes in `forms.js` and `responses.js` derive ownership from the verified JWT (`req.user.id`), not from any client-supplied parameter.
5. **Database Credentials** — Stored in `.env`, never hardcoded. `.env` is gitignored.
6. **Input Validation** — All Oracle queries use bind parameters to prevent SQL injection.
7. **Audit Logs** — Track all create/submit actions.
8. **Password Migration** — `migrate_passwords.js` available to hash any legacy plain-text passwords without resetting accounts.

### ⚠️ Pending / To Improve

- **Security Headers** — `helmet` not yet added; headers like `Content-Security-Policy` and `X-Frame-Options` are missing.
- **Rate Limiting** — `express-rate-limit` not yet added; login/signup endpoints are still vulnerable to brute-force.
- **HttpOnly Cookies** — Token is currently stored client-side in JS; switching to HttpOnly cookies would protect against XSS token theft.
- **CORS** — Enabled globally with no origin restriction; should be locked to known origins in production.

## 🚦 Running the App

### Development
```bash
npm run dev
# Auto-reloads on file changes
```

### Production
```bash
npm start
```

### Test Data
After running `project_db.sql`:
- **Faculty Account:** email alice.miller@college.edu (password: hashedpw123)
- **Student Account:** email Dr. Bob Smith (password: hashedpw456)
- **Sample Forms:** "Midsem Feedback" (Form ID: 1), "CS Dept Survey" (Form ID: 2)

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check Oracle is running
sqlplus /nolog
SQL> connect user/user@XEPDB1

# Check .env credentials match
cat .env
```

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port 8000 already in use
```bash
# Change in .env: PORT=8001
# Or kill the process:
lsof -i :8000
kill -9 <PID>
```

### Form won't submit
- Check deadline hasn't passed (DB trigger will reject)
- Verify all required questions are answered
- Check `audit_logs` table for errors

### "Invalid or expired token"
- JWT expires after 8 hours — log in again for a fresh token
- Ensure `JWT_SECRET` in `.env` is set and hasn't changed between server restarts

## 📈 Future Enhancements

- [x] Bcrypt password hashing
- [x] JWT authentication
- [ ] JWT refresh tokens
- [ ] `helmet` security headers
- [ ] Rate limiting on auth endpoints (`express-rate-limit`)
- [ ] HttpOnly Cookie token storage
- [ ] Conditional branching (skip logic)
- [ ] Email notifications on new responses
- [ ] Advanced analytics charts (Chart.js/D3.js)
- [ ] LMS integration (Canvas, Blackboard)
- [ ] Export to CSV/PDF with formatting
- [ ] Role-based access control (department admin)
- [ ] Form versioning & drafts
- [ ] Real-time collaboration (WebSockets)
- [ ] Mobile app (React Native)

## 👨‍💻 Author

**Vector**  
GitHub: [@HalcyonVector](https://github.com/HalcyonVector)  

## 🙋 Support

Found a bug or have a feature request?  
[Open an issue](https://github.com/HalcyonVector/formflow/issues) on GitHub.

---

**Made with ❤️ for educators and students everywhere**