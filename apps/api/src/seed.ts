import { pool } from "./config/db";
import { hashPassword } from "./utils/password";

const createTables = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'RESIDENT' CHECK (role IN ('ADMIN', 'RESIDENT', 'SECURITY')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS societies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS flats (
        id SERIAL PRIMARY KEY,
        society_id INTEGER NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        flat_number VARCHAR(20) NOT NULL,
        block VARCHAR(10),
        floor INTEGER,
        type VARCHAR(20) DEFAULT '2BHK',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS residents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        flat_id INTEGER NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
        phone VARCHAR(20),
        emergency_contact VARCHAR(20),
        moving_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id SERIAL PRIMARY KEY,
        flat_id INTEGER NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
        resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        billing_month INTEGER NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
        billing_year INTEGER NOT NULL CHECK (billing_year >= 2000),
        maintenance_amount DECIMAL(10,2) NOT NULL CHECK (maintenance_amount > 0),
        additional_charges DECIMAL(10,2) DEFAULT 0 CHECK (additional_charges >= 0),
        late_fee DECIMAL(10,2) DEFAULT 0 CHECK (late_fee >= 0),
        total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
        due_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (flat_id, billing_month, billing_year)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        bill_id INTEGER NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
        payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('ONLINE', 'OFFLINE')),
        paid_amount DECIMAL(10,2) NOT NULL CHECK (paid_amount > 0),
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        transaction_id VARCHAR(100),
        receipt_number VARCHAR(100),
        note TEXT,
        received_by INTEGER REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_flat_id ON maintenance(flat_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_resident_id ON maintenance(resident_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_maintenance_period ON maintenance(billing_month, billing_year)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);

    // Add razorpay columns if they don't exist (safe migration)
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100)`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100)`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(256)`);

    // Add remaining_amount column for partial payments support
    await client.query(`ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2)`);
    await client.query(`UPDATE maintenance SET remaining_amount = total_amount WHERE remaining_amount IS NULL`);
    await client.query(`ALTER TABLE maintenance ALTER COLUMN remaining_amount SET NOT NULL`);

    // Add images column to complaints if it doesn't exist
    await client.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]'`);

    // Add video and priority columns to complaints if they don't exist
    await client.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS video_url TEXT`);
    await client.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS video_type VARCHAR(50)`);
    await client.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL'`);

    // Add phone column to users if it doesn't exist (for admin/security phone display)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`);

    // Add notice_type and expiry_date columns to notices if they don't exist
    await client.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS notice_type VARCHAR(50) DEFAULT 'GENERAL'`);
    await client.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP`);

    // Add visitor management columns if they don't exist
    await client.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visitor_type VARCHAR(20) DEFAULT 'GUEST'`);
    await client.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS expected_date DATE`);
    await client.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS expected_time TIME`);
    await client.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS notes TEXT`);
    await client.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)`);
    await client.query(`ALTER TABLE visitors DROP CONSTRAINT IF EXISTS visitors_status_check`);
    await client.query(`ALTER TABLE visitors ADD CONSTRAINT visitors_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPECTED','CHECKED_IN','CHECKED_OUT','CANCELLED'))`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
        images TEXT DEFAULT '[]',
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        society_id INTEGER NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        flat_id INTEGER NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
        visitor_name VARCHAR(100) NOT NULL,
        visitor_phone VARCHAR(20) NOT NULL,
        purpose VARCHAR(200),
        vehicle_number VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT')),
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        approved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        flat_id INTEGER REFERENCES flats(id) ON DELETE CASCADE,
        vehicle_number VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'BIKE', 'SCOOTER', 'EV', 'OTHER')),
        brand VARCHAR(50),
        model VARCHAR(50),
        color VARCHAR(30),
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS flat_id INTEGER REFERENCES flats(id) ON DELETE CASCADE`);
    await client.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'`);
    await client.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_status_check') THEN ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check CHECK (status IN ('ACTIVE', 'INACTIVE')); END IF; END $$`);
    await client.query(`DO $$ DECLARE conname_var RECORD; BEGIN FOR conname_var IN SELECT conname FROM pg_constraint WHERE conrelid = 'vehicles'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%vehicle_type%' LOOP EXECUTE 'ALTER TABLE vehicles DROP CONSTRAINT ' || conname_var.conname; END LOOP; END $$`);
    await client.query(`ALTER TABLE vehicles ADD CONSTRAINT vehicles_vehicle_type_check CHECK (vehicle_type IN ('CAR', 'BIKE', 'SCOOTER', 'EV', 'OTHER'))`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        society_id INTEGER NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        event_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        location VARCHAR(200),
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query("COMMIT");
    console.log("All tables created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating tables:", error);
    throw error;
  } finally {
    client.release();
  }
};

const seedAdmin = async (): Promise<void> => {
  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@society.com"]
    );
    if (existing.rows.length > 0) {
      console.log("Admin user already exists, skipping seed");
      return;
    }

    const hash = await hashPassword("Admin@123");
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      ["System Admin", "admin@society.com", hash, "ADMIN"]
    );
    console.log("Admin user seeded successfully");
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};

const seedSociety = async (): Promise<number | null> => {
  try {
    const existing = await pool.query(
      "SELECT id FROM societies WHERE name = $1",
      ["Green Valley Society"]
    );
    if (existing.rows.length > 0) {
      console.log("Society already exists, skipping seed");
      return existing.rows[0].id;
    }

    const result = await pool.query(
      "INSERT INTO societies (name, address, city, state, pincode, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        "Green Valley Society",
        "123 MG Road, Sector 5",
        "Mumbai",
        "Maharashtra",
        "400001",
        "9876543210",
        "greenvalley@society.com",
      ]
    );
    console.log("Society seeded successfully");
    return result.rows[0].id;
  } catch (error) {
    console.error("Error seeding society:", error);
    return null;
  }
};

const seedFlats = async (societyId: number): Promise<void> => {
  try {
    const existingResult = await pool.query(
      "SELECT flat_number FROM flats WHERE society_id = $1",
      [societyId]
    );
    const existingNumbers = new Set(
      existingResult.rows.map((r: { flat_number: string }) => r.flat_number)
    );

    const flats = [
      { flat_number: "A-101", block: "A", floor: 1, type: "2BHK" },
      { flat_number: "A-102", block: "A", floor: 1, type: "3BHK" },
      { flat_number: "A-201", block: "A", floor: 2, type: "2BHK" },
      { flat_number: "A-202", block: "A", floor: 2, type: "3BHK" },
      { flat_number: "A-301", block: "A", floor: 3, type: "2BHK" },
      { flat_number: "A-302", block: "A", floor: 3, type: "3BHK" },
      { flat_number: "A-401", block: "A", floor: 4, type: "2BHK" },
      { flat_number: "A-402", block: "A", floor: 4, type: "3BHK" },
      { flat_number: "A-501", block: "A", floor: 5, type: "2BHK" },
      { flat_number: "A-502", block: "A", floor: 5, type: "3BHK" },
      { flat_number: "B-101", block: "B", floor: 1, type: "2BHK" },
      { flat_number: "B-102", block: "B", floor: 1, type: "3BHK" },
      { flat_number: "B-201", block: "B", floor: 2, type: "2BHK" },
      { flat_number: "B-202", block: "B", floor: 2, type: "3BHK" },
      { flat_number: "B-301", block: "B", floor: 3, type: "2BHK" },
      { flat_number: "B-302", block: "B", floor: 3, type: "3BHK" },
      { flat_number: "B-401", block: "B", floor: 4, type: "2BHK" },
      { flat_number: "B-402", block: "B", floor: 4, type: "3BHK" },
      { flat_number: "B-501", block: "B", floor: 5, type: "2BHK" },
      { flat_number: "B-502", block: "B", floor: 5, type: "3BHK" },
      { flat_number: "C-101", block: "C", floor: 1, type: "2BHK" },
      { flat_number: "C-102", block: "C", floor: 1, type: "3BHK" },
      { flat_number: "C-201", block: "C", floor: 2, type: "2BHK" },
      { flat_number: "C-202", block: "C", floor: 2, type: "3BHK" },
      { flat_number: "C-301", block: "C", floor: 3, type: "2BHK" },
    ];

    let added = 0;
    for (const flat of flats) {
      if (!existingNumbers.has(flat.flat_number)) {
        await pool.query(
          "INSERT INTO flats (society_id, flat_number, block, floor, type) VALUES ($1, $2, $3, $4, $5)",
          [societyId, flat.flat_number, flat.block, flat.floor, flat.type]
        );
        added++;
      }
    }
    console.log(`${added} new flats seeded (${existingResult.rows.length + added} total)`);
  } catch (error) {
    console.error("Error seeding flats:", error);
  }
};

const seedResidents = async (societyId: number): Promise<void> => {
  try {
    const flatResult = await pool.query(
      "SELECT id, flat_number, type FROM flats WHERE society_id = $1 ORDER BY id",
      [societyId]
    );
    const flats = flatResult.rows as { id: number; flat_number: string; type: string }[];

    const existingResidents = await pool.query(
      "SELECT flat_id FROM residents WHERE flat_id = ANY($1)",
      [flats.map((f) => f.id)]
    );
    const occupiedFlatIds = new Set(
      existingResidents.rows.map((r: { flat_id: number }) => r.flat_id)
    );

    const names = [
      "Rahul Kumar", "Priya Sharma", "Amit Patel", "Neha Gupta", "Vikram Singh",
      "Anjali Deshmukh", "Suresh Reddy", "Pooja Verma", "Rajesh Nair", "Kavita Joshi",
      "Mohan Kulkarni", "Sunita Rao", "Deepak Mishra", "Meena Iyer", "Arjun Mehta",
      "Swati Kulkarni", "Kiran Bhatt", "Rina Kamat", "Nikhil Chandra", "Geeta Pandey",
      "Sanjay Kulkarni", "Lata Kher", "Manoj Tiwari", "Rekha Jadhav", "Vinod Desai",
    ];

    const hash = await hashPassword("Resident@123");
    const now = new Date();
    const billingMonth = now.getMonth() + 1;
    const billingYear = now.getFullYear();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    let added = 0;
    for (let i = 0; i < flats.length; i++) {
      const flat = flats[i]!;
      if (occupiedFlatIds.has(flat.id)) continue;

      const email = `resident${i + 1}@test.com`;
      const name = names[i] || `Resident ${i + 1}`;
      const phone = `987654${String(3200 + i).padStart(4, "0")}`;
      const emergencyPhone = `987654${String(3250 + i).padStart(4, "0")}`;

      const userResult = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
        [name, email, hash, "RESIDENT"]
      );

      const residentResult = await pool.query(
        "INSERT INTO residents (user_id, flat_id, phone, emergency_contact) VALUES ($1, $2, $3, $4) RETURNING id",
        [userResult.rows[0].id, flat.id, phone, emergencyPhone]
      );

      const maintenanceAmount = flat.type === "3BHK" ? 3500 : 2500;
      const totalAmount = maintenanceAmount + 50;
      await pool.query(
        `INSERT INTO maintenance (flat_id, resident_id, billing_month, billing_year, maintenance_amount, additional_charges, late_fee, total_amount, due_date, status, description)
         VALUES ($1, $2, $3, $4, $5, 0, 50, $6, $7, 'UNPAID', 'Monthly maintenance charges')`,
        [flat.id, residentResult.rows[0].id, billingMonth, billingYear, maintenanceAmount, totalAmount, dueDate]
      );

      added++;
    }
    console.log(`${added} residents seeded (${occupiedFlatIds.size + added} total)`);
  } catch (error) {
    console.error("Error seeding residents:", error);
  }
};

const seedSecurity = async (): Promise<void> => {
  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["security@test.com"]
    );
    if (existing.rows.length > 0) {
      console.log("Security user already exists, skipping seed");
      return;
    }

    const hash = await hashPassword("Security@123");
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      ["Site Security", "security@test.com", hash, "SECURITY"]
    );
    console.log("Security user seeded successfully");
  } catch (error) {
    console.error("Error seeding security:", error);
  }
};

const defaultSettings: { key: string; value: string; description: string }[] = [
  { key: "rate_1BHK", value: "1500", description: "Monthly maintenance rate for 1BHK flats" },
  { key: "rate_2BHK", value: "2500", description: "Monthly maintenance rate for 2BHK flats" },
  { key: "rate_3BHK", value: "3500", description: "Monthly maintenance rate for 3BHK flats" },
  { key: "rate_4BHK", value: "5000", description: "Monthly maintenance rate for 4BHK flats" },
  { key: "rate_Studio", value: "1000", description: "Monthly maintenance rate for Studio flats" },
  { key: "late_fee", value: "50", description: "Late fee charged after due date" },
  { key: "due_day", value: "5", description: "Day of month when payment is due (1-28)" },
  { key: "currency", value: "INR", description: "Currency code for payments" },
];

const seedNotices = async (): Promise<void> => {
  try {
    const existing = await pool.query("SELECT COUNT(*) FROM notices");
    if (Number(existing.rows[0].count) > 0) {
      console.log("Notices already exist, skipping seed");
      return;
    }

    const societyResult = await pool.query("SELECT id FROM societies LIMIT 1");
    const adminResult = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (societyResult.rows.length === 0 || adminResult.rows.length === 0) {
      console.log("No society or admin found, skipping notice seed");
      return;
    }

    const societyId = societyResult.rows[0].id;
    const adminId = adminResult.rows[0].id;

    const notices = [
      {
        title: "Society Maintenance Due",
        content: "Please pay your monthly maintenance bill before the due date. Payments can be made online through the portal or directly to the society office.",
        notice_type: "MAINTENANCE",
        priority: "HIGH",
        expiry_date: null,
      },
      {
        title: "Water Supply Maintenance",
        content: "Water supply will be unavailable from 10:00 AM to 1:00 PM on Sunday due to scheduled pipe maintenance. Please store water accordingly.",
        notice_type: "MAINTENANCE",
        priority: "NORMAL",
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Society Meeting",
        content: "All residents are requested to attend the society meeting on Sunday at 6:00 PM in the community hall. Agenda includes annual budget review and new rule proposals.",
        notice_type: "MEETING",
        priority: "NORMAL",
        expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Parking Notice",
        content: "Residents are requested to park vehicles only in their assigned parking spaces. Visitors vehicles should be parked in the designated visitor area. Unauthorized parking will result in a fine.",
        notice_type: "GENERAL",
        priority: "URGENT",
        expiry_date: null,
      },
    ];

    for (const notice of notices) {
      await pool.query(
        `INSERT INTO notices (society_id, title, content, notice_type, priority, created_by, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [societyId, notice.title, notice.content, notice.notice_type, notice.priority, adminId, notice.expiry_date]
      );
    }
    console.log(`${notices.length} sample notices seeded`);
  } catch (error) {
    console.error("Error seeding notices:", error);
  }
};

const seedVisitors = async (): Promise<void> => {
  try {
    const existing = await pool.query("SELECT COUNT(*) FROM visitors");
    if (Number(existing.rows[0].count) > 0) {
      console.log("Visitors already exist, skipping seed");
      return;
    }

    const residents = await pool.query("SELECT id, flat_id FROM residents LIMIT 5");
    if (residents.rows.length === 0) {
      console.log("No residents found, skipping visitor seed");
      return;
    }

    const adminResult = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    const createdBy = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const visitors = [
      { resident_idx: 0, visitor_name: "Rahul Sharma", visitor_phone: "9876543210", purpose: "Family visit", visitor_type: "GUEST", status: "EXPECTED", expected_time: "18:00", vehicle_number: "MH-12-AB-1234" },
      { resident_idx: 0, visitor_name: "Amazon Delivery", visitor_phone: "9876501111", purpose: "Package delivery", visitor_type: "DELIVERY", status: "CHECKED_IN", expected_time: "14:00", check_in_time: new Date(now.getTime() - 3600000) },
      { resident_idx: 1, visitor_name: "Amit Patil", visitor_phone: "9876501234", purpose: "AC Repair", visitor_type: "SERVICE", status: "CHECKED_OUT", expected_time: "15:00", check_in_time: new Date(now.getTime() - 7200000), check_out_time: new Date(now.getTime() - 3600000) },
      { resident_idx: 1, visitor_name: "Ola Cab", visitor_phone: "9876502222", purpose: "Airport drop", visitor_type: "CAB", status: "CHECKED_IN", expected_time: "06:00", check_in_time: new Date(now.getTime() - 1800000) },
      { resident_idx: 2, visitor_name: "Priya Verma", visitor_phone: "9876503333", purpose: "Dinner invitation", visitor_type: "GUEST", status: "EXPECTED", expected_time: "19:30", expected_date: today },
      { resident_idx: 2, visitor_name: "Swiggy Delivery", visitor_phone: "9876504444", purpose: "Food delivery", visitor_type: "DELIVERY", status: "CANCELLED", expected_time: "12:00" },
      { resident_idx: 3, visitor_name: "Plumber Raju", visitor_phone: "9876505555", purpose: "Bathroom leakage repair", visitor_type: "SERVICE", status: "CHECKED_OUT", expected_time: "11:00", check_in_time: new Date(now.getTime() - 86400000), check_out_time: new Date(now.getTime() - 82800000) },
      { resident_idx: 3, visitor_name: "Uber Cab", visitor_phone: "9876506666", purpose: "Office pickup", visitor_type: "CAB", status: "CHECKED_OUT", expected_time: "08:30", check_in_time: new Date(now.getTime() - 43200000), check_out_time: new Date(now.getTime() - 41400000) },
      { resident_idx: 4, visitor_name: "Suresh Kumar", visitor_phone: "9876507777", purpose: "Friend visit", visitor_type: "GUEST", status: "EXPECTED", expected_time: "16:00" },
      { resident_idx: 4, visitor_name: "Electrician Mohan", visitor_phone: "9876508888", purpose: "Fan installation", visitor_type: "SERVICE", status: "PENDING", expected_time: "13:00" },
    ];

    let added = 0;
    for (const v of visitors) {
      const rIdx = v.resident_idx % residents.rows.length;
      const resident = residents.rows[rIdx];
      await pool.query(
        `INSERT INTO visitors (resident_id, flat_id, visitor_name, visitor_phone, purpose, vehicle_number, status, visitor_type, expected_date, expected_time, check_in_time, check_out_time, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [resident.id, resident.flat_id, v.visitor_name, v.visitor_phone, v.purpose, v.vehicle_number || null, v.status, v.visitor_type, v.expected_date || today, v.expected_time, v.check_in_time || null, v.check_out_time || null, createdBy]
      );
      added++;
    }
    console.log(`${added} sample visitors seeded`);
  } catch (error) {
    console.error("Error seeding visitors:", error);
  }
};

const seedSettings = async (): Promise<void> => {
  try {
    const existing = await pool.query("SELECT COUNT(*) FROM settings");
    if (Number(existing.rows[0].count) > 0) {
      console.log("Settings already exist, skipping seed");
      return;
    }

    for (const setting of defaultSettings) {
      await pool.query(
        "INSERT INTO settings (key, value, description) VALUES ($1, $2, $3)",
        [setting.key, setting.value, setting.description]
      );
    }
    console.log(`${defaultSettings.length} default settings seeded`);
  } catch (error) {
    console.error("Error seeding settings:", error);
  }
};

const seedVehicles = async (): Promise<void> => {
  try {
    const countResult = await pool.query("SELECT COUNT(*) FROM vehicles");
    const existingCount = Number(countResult.rows[0].count);

    const residents = await pool.query("SELECT id, flat_id FROM residents ORDER BY id");
    if (residents.rows.length === 0) {
      console.log("No residents found, skipping vehicle seed");
      return;
    }

    const expectedCount = residents.rows.length * 2;
    if (existingCount >= expectedCount) {
      console.log(`Vehicles already seeded (${existingCount} existing, ${expectedCount} expected), skipping`);
      return;
    }

    if (existingCount > 0) {
      await pool.query("DELETE FROM vehicles");
      console.log(`Cleared ${existingCount} old vehicles, re-seeding`);
    }

    const vehiclesByResident: { vehicle_number: string; vehicle_type: string; brand: string; model: string; color: string }[][] = [
      [{ vehicle_number: "MH01AA1001", vehicle_type: "CAR", brand: "Hyundai", model: "i20", color: "White" }, { vehicle_number: "MH01AA1002", vehicle_type: "BIKE", brand: "Honda", model: "Activa 6G", color: "Black" }],
      [{ vehicle_number: "MH01AB2001", vehicle_type: "BIKE", brand: "Bajaj", model: "Pulsar 150", color: "Black" }, { vehicle_number: "MH01AB2002", vehicle_type: "SCOOTER", brand: "TVS", model: "Jupiter", color: "Blue" }],
      [{ vehicle_number: "MH01AC3001", vehicle_type: "CAR", brand: "Maruti", model: "Swift", color: "Red" }, { vehicle_number: "MH01AC3002", vehicle_type: "CAR", brand: "Hyundai", model: "Creta", color: "White" }],
      [{ vehicle_number: "MH01AD4001", vehicle_type: "SCOOTER", brand: "Suzuki", model: "Access 125", color: "White" }, { vehicle_number: "MH01AD4002", vehicle_type: "BIKE", brand: "Yamaha", model: "FZ", color: "Blue" }],
      [{ vehicle_number: "MH01AE5001", vehicle_type: "CAR", brand: "Toyota", model: "Innova Crysta", color: "Silver" }, { vehicle_number: "MH01AE5002", vehicle_type: "BIKE", brand: "Royal Enfield", model: "Classic 350", color: "Maroon" }],
      [{ vehicle_number: "MH01AF6001", vehicle_type: "EV", brand: "Tata", model: "Nexon EV", color: "White" }, { vehicle_number: "MH01AF6002", vehicle_type: "CAR", brand: "Kia", model: "Sonet", color: "Grey" }],
      [{ vehicle_number: "MH01AG7001", vehicle_type: "CAR", brand: "Honda", model: "City", color: "Grey" }, { vehicle_number: "MH01AG7002", vehicle_type: "SCOOTER", brand: "Honda", model: "Activa", color: "Red" }],
      [{ vehicle_number: "MH01AH8001", vehicle_type: "OTHER", brand: "Mahindra", model: "Thar", color: "Green" }, { vehicle_number: "MH01AH8002", vehicle_type: "CAR", brand: "MG", model: "Hector", color: "Black" }],
      [{ vehicle_number: "MH01AI9001", vehicle_type: "CAR", brand: "Volkswagen", model: "Taigun", color: "Blue" }, { vehicle_number: "MH01AI9002", vehicle_type: "BIKE", brand: "KTM", model: "Duke 200", color: "Orange" }],
      [{ vehicle_number: "MH01AJ1001", vehicle_type: "CAR", brand: "Kia", model: "Seltos", color: "Brown" }, { vehicle_number: "MH01AJ1002", vehicle_type: "SCOOTER", brand: "Ola", model: "S1 Pro", color: "Pink" }],
      [{ vehicle_number: "MH01AK1101", vehicle_type: "CAR", brand: "Nissan", model: "Magnite", color: "Red" }, { vehicle_number: "MH01AK1102", vehicle_type: "BIKE", brand: "Hero", model: "Splendor", color: "Black" }],
      [{ vehicle_number: "MH01AL1201", vehicle_type: "SCOOTER", brand: "TVS", model: "Ntorq", color: "Yellow" }, { vehicle_number: "MH01AL1202", vehicle_type: "CAR", brand: "Renault", model: "Kiger", color: "White" }],
      [{ vehicle_number: "MH01AM1301", vehicle_type: "CAR", brand: "Citroen", model: "C3", color: "White" }, { vehicle_number: "MH01AM1302", vehicle_type: "EV", brand: "BYD", model: "Atto 3", color: "Red" }],
      [{ vehicle_number: "MH01AN1401", vehicle_type: "BIKE", brand: "Bajaj", model: "Avenger", color: "Black" }, { vehicle_number: "MH01AN1402", vehicle_type: "CAR", brand: "Maruti", model: "Baleno", color: "Blue" }],
      [{ vehicle_number: "MH01AO1501", vehicle_type: "CAR", brand: "Skoda", model: "Kushaq", color: "Silver" }, { vehicle_number: "MH01AO1502", vehicle_type: "SCOOTER", brand: "Suzuki", model: "Burgman", color: "Grey" }],
      [{ vehicle_number: "MH01AP1601", vehicle_type: "BIKE", brand: "Yamaha", model: "MT-15", color: "Blue" }, { vehicle_number: "MH01AP1602", vehicle_type: "CAR", brand: "Hyundai", model: "Venue", color: "Silver" }],
      [{ vehicle_number: "MH01AQ1701", vehicle_type: "CAR", brand: "Toyota", model: "Glanza", color: "White" }, { vehicle_number: "MH01AQ1702", vehicle_type: "BIKE", brand: "Honda", model: "Shine", color: "Black" }],
      [{ vehicle_number: "MH01AR1801", vehicle_type: "SCOOTER", brand: "Hero", model: "Pleasure Plus", color: "Purple" }, { vehicle_number: "MH01AR1802", vehicle_type: "EV", brand: "Ather", model: "450X", color: "White" }],
      [{ vehicle_number: "MH01AS1901", vehicle_type: "CAR", brand: "Force", model: "Gurkha", color: "Green" }, { vehicle_number: "MH01AS1902", vehicle_type: "BIKE", brand: "Royal Enfield", model: "Meteor 350", color: "Black" }],
      [{ vehicle_number: "MH01AT2001", vehicle_type: "CAR", brand: "Maruti", model: "Brezza", color: "Red" }, { vehicle_number: "MH01AT2002", vehicle_type: "SCOOTER", brand: "Honda", model: "Dio", color: "Grey" }],
      [{ vehicle_number: "MH01AU2101", vehicle_type: "CAR", brand: "Hyundai", model: "Verna", color: "White" }, { vehicle_number: "MH01AU2102", vehicle_type: "BIKE", brand: "Bajaj", model: "Dominar", color: "Black" }],
      [{ vehicle_number: "MH01AV2201", vehicle_type: "CAR", brand: "Kia", model: "Carens", color: "Silver" }, { vehicle_number: "MH01AV2202", vehicle_type: "EV", brand: "Tata", model: "Tiago EV", color: "Blue" }],
      [{ vehicle_number: "MH01AW2301", vehicle_type: "BIKE", brand: "TVS", model: "Apache RTR", color: "Red" }, { vehicle_number: "MH01AW2302", vehicle_type: "CAR", brand: "Honda", model: "Amaze", color: "White" }],
      [{ vehicle_number: "MH01AX2401", vehicle_type: "CAR", brand: "Maruti", model: "WagonR", color: "Blue" }, { vehicle_number: "MH01AX2402", vehicle_type: "SCOOTER", brand: "TVS", model: "Zest", color: "Red" }],
      [{ vehicle_number: "MH01AY2501", vehicle_type: "BIKE", brand: "Hero", model: "Xtreme 160R", color: "Black" }, { vehicle_number: "MH01AY2502", vehicle_type: "CAR", brand: "Renault", model: "Triber", color: "Orange" }],
    ];

    let added = 0;
    for (let i = 0; i < residents.rows.length; i++) {
      const resident = residents.rows[i];
      const pair = vehiclesByResident[i];
      if (!pair) continue;
      for (const v of pair) {
        await pool.query(
          `INSERT INTO vehicles (resident_id, flat_id, vehicle_number, vehicle_type, brand, model, color, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')`,
          [resident.id, resident.flat_id, v.vehicle_number, v.vehicle_type, v.brand, v.model, v.color]
        );
        added++;
      }
    }
    console.log(`${added} sample vehicles seeded (${residents.rows.length} residents x 2)`);
  } catch (error) {
    console.error("Error seeding vehicles:", error);
  }
};

export const runSeed = async (): Promise<void> => {
  await createTables();
  await seedAdmin();
  const societyId = await seedSociety();
  if (societyId) {
    await seedFlats(societyId);
    await seedResidents(societyId);
  }
  await seedSecurity();
  await seedSettings();
  await seedNotices();
  await seedVisitors();
  await seedVehicles();
};
