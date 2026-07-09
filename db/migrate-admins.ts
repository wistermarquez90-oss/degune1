import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: "ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com",
  port: 4000,
  user: "2JE4LrwNYERyeTU.root",
  password: "zLjpAqtv9r5nGcSV4qKLZBdBmebHXaNK",
  database: "19f3f1ca-3952-8cdc-8000-093815db34f0",
  ssl: {},
};

async function migrate() {
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // Check if admins table exists
    const [rows] = await conn.execute(
      `SELECT 1 FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'admins'`,
      [DB_CONFIG.database]
    );

    if ((rows as any[]).length === 0) {
      console.log("Creating admins table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS admins (
          id bigint unsigned NOT NULL AUTO_INCREMENT,
          username varchar(100) NOT NULL,
          password_hash varchar(255) NOT NULL,
          name varchar(255) NOT NULL,
          role enum('admin','superadmin') NOT NULL DEFAULT 'admin',
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY admins_username_unique (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("admins table created successfully!");
    } else {
      console.log("admins table already exists.");
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await conn.end();
  }
}

migrate();
