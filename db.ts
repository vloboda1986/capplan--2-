
import { MOCK_DEVELOPERS, MOCK_PROJECTS, INITIAL_PLANS, MOCK_TEAMS, MOCK_APP_USERS } from './constants';
import { Project, Subproject } from './types';

// Declare the global initSqlJs function provided by the script tag
declare global {
  function initSqlJs(config: any): Promise<any>;
}

export const DB_STORAGE_KEY = 'capPlan_sqlite_db_v3';

class SQLiteManager {
  db: any = null;
  SQL: any = null;
  readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.init();
  }

  async init() {
    if (this.db) return;

    try {
      // Initialize sql.js
      this.SQL = await initSqlJs({
        // Locate the WASM file from the CDN
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      // Check for existing DB in localStorage
      const storedDb = localStorage.getItem(DB_STORAGE_KEY);
      
      if (storedDb) {
        // Load existing DB
        const binaryString = atob(storedDb);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        this.db = new this.SQL.Database(bytes);
        console.log("SQLite Database loaded from storage.");
        
        // Ensure tables exist
        this.createTables();
        
        // Migration: Add new columns to events table if they don't exist
        try {
           this.db.run("ALTER TABLE events ADD COLUMN developerId TEXT");
           this.db.run("ALTER TABLE events ADD COLUMN projectId TEXT");
           console.log("Migrated events table schema.");
           this.save();
        } catch (e) {
           // Ignore error if columns already exist
        }

      } else {
        // Create new DB
        this.db = new this.SQL.Database();
        console.log("New SQLite Database created.");
        this.createTables();
        await this.seedData();
        this.save();
      }
    } catch (err) {
      console.error("Failed to initialize SQLite:", err);
    }
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        color TEXT
      );
      
      CREATE TABLE IF NOT EXISTS developers (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        role TEXT, 
        level TEXT, 
        avatar TEXT, 
        teamId TEXT, 
        capacity REAL
      );
      
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        color TEXT, 
        priority TEXT, 
        subproject TEXT, 
        deadline TEXT, 
        subprojects TEXT, -- JSON string
        riskLevel TEXT, 
        riskDescription TEXT, 
        lastStatusUpdate TEXT, 
        shortUpdate TEXT, 
        managerId TEXT, 
        stack TEXT
      );
      
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        developerId TEXT, 
        projectId TEXT
      );
      
      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        developerId TEXT, 
        projectId TEXT, 
        date TEXT, 
        hours REAL
      );
      
      CREATE TABLE IF NOT EXISTS absences (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        developerId TEXT, 
        date TEXT, 
        type TEXT
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        role TEXT, 
        email TEXT
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY, 
        date TEXT, 
        type TEXT, 
        title TEXT,
        developerId TEXT,
        projectId TEXT
      );

      CREATE TABLE IF NOT EXISTS risk_logs (
        id TEXT PRIMARY KEY,
        projectId TEXT,
        date TEXT,
        riskLevel TEXT,
        riskDescription TEXT,
        updatedBy TEXT
      );
    `);
  }

  async seedData() {
    // Users
    MOCK_APP_USERS.forEach(u => {
      this.run(`INSERT OR IGNORE INTO users (id, name, role, email) VALUES (?, ?, ?, ?)`, [u.id, u.name, u.role, u.email]);
    });

    // Teams
    MOCK_TEAMS.forEach(t => {
      this.run(`INSERT OR IGNORE INTO teams (id, name, color) VALUES (?, ?, ?)`, [t.id, t.name, t.color]);
    });

    // Developers
    MOCK_DEVELOPERS.forEach(d => {
      this.run(`INSERT OR IGNORE INTO developers (id, name, role, level, avatar, teamId, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
        [d.id, d.name, d.role, d.level, d.avatar, d.teamId, d.capacity || 8]);
    });

    // Projects
    MOCK_PROJECTS.forEach(p => {
      this.run(`INSERT OR IGNORE INTO projects (id, name, color, managerId, subprojects) VALUES (?, ?, ?, ?, ?)`, 
        [p.id, p.name, p.color, p.managerId, JSON.stringify(p.subprojects || [])]);
    });

    // Plans (Allocations & Assignments)
    INITIAL_PLANS.forEach(plan => {
      plan.projects.forEach(proj => {
        this.run(`INSERT INTO assignments (developerId, projectId) VALUES (?, ?)`, [plan.developerId, proj.projectId]);
        
        Object.entries(proj.allocations).forEach(([date, hours]) => {
          if (hours > 0) {
            this.run(`INSERT INTO allocations (developerId, projectId, date, hours) VALUES (?, ?, ?, ?)`, 
              [plan.developerId, proj.projectId, date, hours]);
          }
        });
      });

      Object.entries(plan.absences).forEach(([date, type]) => {
        this.run(`INSERT INTO absences (developerId, date, type) VALUES (?, ?, ?)`, [plan.developerId, date, type]);
      });
    });
  }

  // Persist DB to LocalStorage
  save() {
    if (!this.db) return;
    const data = this.db.export();
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    localStorage.setItem(DB_STORAGE_KEY, btoa(binary));
  }

  // Helper to execute query and return objects
  query(sql: string, params: any[] = []): any[] {
    if (!this.db) return [];
    
    // Sanitize parameters: SQLite expects null, not undefined
    const safeParams = params.map(p => p === undefined ? null : p);

    const stmt = this.db.prepare(sql);
    stmt.bind(safeParams);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
  
  // Helper to run insert/update/delete
  run(sql: string, params: any[] = []) {
    if (!this.db) return;

    // Sanitize parameters: SQLite expects null, not undefined
    const safeParams = params.map(p => p === undefined ? null : p);

    this.db.run(sql, safeParams);
    this.save();
  }
}

export const dbManager = new SQLiteManager();

export const initializeDB = async () => {
  await dbManager.readyPromise;
};
