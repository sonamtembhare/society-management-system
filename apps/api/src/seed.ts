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
        amount DECIMAL(10,2) NOT NULL,
        billing_period VARCHAR(20) NOT NULL,
        description TEXT,
        due_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        maintenance_id INTEGER NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
        resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
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
        vehicle_number VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'BIKE', 'SCOOTER', 'OTHER')),
        brand VARCHAR(50),
        model VARCHAR(50),
        color VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
    const existing = await pool.query(
      "SELECT id FROM flats WHERE society_id = $1 LIMIT 1",
      [societyId]
    );
    if (existing.rows.length > 0) {
      console.log("Flats already exist, skipping seed");
      return;
    }

    const flats = [
      { flat_number: "A-101", block: "A", floor: 1, type: "2BHK" },
      { flat_number: "A-102", block: "A", floor: 1, type: "3BHK" },
      { flat_number: "B-201", block: "B", floor: 2, type: "2BHK" },
      { flat_number: "B-202", block: "B", floor: 2, type: "3BHK" },
    ];

    for (const flat of flats) {
      await pool.query(
        "INSERT INTO flats (society_id, flat_number, block, floor, type) VALUES ($1, $2, $3, $4, $5)",
        [societyId, flat.flat_number, flat.block, flat.floor, flat.type]
      );
    }
    console.log("4 flats seeded successfully");
  } catch (error) {
    console.error("Error seeding flats:", error);
  }
};

const seedResident = async (flatId: number): Promise<void> => {
  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["resident@test.com"]
    );
    if (existing.rows.length > 0) {
      console.log("Resident user already exists, skipping seed");
      return;
    }

    const hash = await hashPassword("Resident@123");
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Rahul Kumar", "resident@test.com", hash, "RESIDENT"]
    );

    const userId = result.rows[0].id;
    await pool.query(
      "INSERT INTO residents (user_id, flat_id, phone, emergency_contact) VALUES ($1, $2, $3, $4)",
      [userId, flatId, "9876543211", "9876543212"]
    );

    const now = new Date();
    const billingPeriod = now.toLocaleString("default", { month: "short", year: "numeric" });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    await pool.query(
      "INSERT INTO maintenance (flat_id, amount, billing_period, description, due_date, status) VALUES ($1, $2, $3, $4, $5, $6)",
      [flatId, 2500, billingPeriod, "Monthly maintenance charges", dueDate, "PENDING"]
    );

    console.log("Resident user seeded successfully");
  } catch (error) {
    console.error("Error seeding resident:", error);
  }
};

const seedResident2 = async (flatId: number): Promise<void> => {
  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["resident2@test.com"]
    );
    if (existing.rows.length > 0) {
      console.log("Resident2 user already exists, skipping seed");
      return;
    }

    const hash = await hashPassword("Resident@123");
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Priya Sharma", "resident2@test.com", hash, "RESIDENT"]
    );

    const userId = result.rows[0].id;
    await pool.query(
      "INSERT INTO residents (user_id, flat_id, phone, emergency_contact) VALUES ($1, $2, $3, $4)",
      [userId, flatId, "9876543213", "9876543214"]
    );

    const now = new Date();
    const billingPeriod = now.toLocaleString("default", { month: "short", year: "numeric" });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    await pool.query(
      "INSERT INTO maintenance (flat_id, amount, billing_period, description, due_date, status) VALUES ($1, $2, $3, $4, $5, $6)",
      [flatId, 2500, billingPeriod, "Monthly maintenance charges", dueDate, "PENDING"]
    );

    console.log("Resident2 user seeded successfully");
  } catch (error) {
    console.error("Error seeding resident2:", error);
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

export const runSeed = async (): Promise<void> => {
  await createTables();
  await seedAdmin();
  const societyId = await seedSociety();
  if (societyId) {
    await seedFlats(societyId);
    const flatResult = await pool.query(
      "SELECT id FROM flats WHERE society_id = $1 ORDER BY id",
      [societyId]
    );
    if (flatResult.rows.length > 0) {
      await seedResident(flatResult.rows[0].id);
    }
    if (flatResult.rows.length > 1) {
      await seedResident2(flatResult.rows[1].id);
    }
  }
  await seedSecurity();
};
