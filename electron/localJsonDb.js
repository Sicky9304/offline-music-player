import fs from 'fs';
import path from 'path';
import { app } from 'electron';

let dbDir = null;

function getDbDir() {
  if (!dbDir) {
    dbDir = path.join(app.getPath('userData'), 'local_db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }
  return dbDir;
}

function getFilePath(tableName) {
  return path.join(getDbDir(), `${tableName}.json`);
}

export function readTable(tableName, defaultVal = []) {
  const filePath = getFilePath(tableName);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`[LocalDB] Error reading ${tableName}:`, err.message);
  }
  return defaultVal;
}

export function writeTable(tableName, data) {
  const filePath = getFilePath(tableName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[LocalDB] Error writing ${tableName}:`, err.message);
  }
}

class LocalQuery {
  constructor(items) {
    this.items = items;
  }

  sort(sortObj) {
    const sortKey = Object.keys(sortObj)[0];
    const sortDir = sortObj[sortKey];
    this.items.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'string') {
        return sortDir === 1
          ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { sensitivity: 'base' });
      }
      if (valA instanceof Date || (typeof valA === 'string' && Date.parse(valA))) {
        return sortDir === 1
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      }
      return sortDir === 1 ? valA - valB : valB - valA;
    });
    return this;
  }

  limit(n) {
    this.items = this.items.slice(0, n);
    return this;
  }

  then(onFulfilled, onRejected) {
    const wrappedItems = this.items.map(item => ({
      ...item,
      toObject() {
        const clone = { ...this };
        delete clone.toObject;
        delete clone.save;
        return clone;
      }
    }));
    return Promise.resolve(wrappedItems).then(onFulfilled, onRejected);
  }
}

export class LocalModel {
  constructor(tableName, defaultVal = []) {
    this.tableName = tableName;
    this.defaultVal = defaultVal;
  }

  getAll() {
    return readTable(this.tableName, this.defaultVal);
  }

  saveAll(data) {
    writeTable(this.tableName, data);
  }

  find(query = {}) {
    let items = this.getAll();
    if (Object.keys(query).length > 0) {
      items = items.filter(item => {
        for (const key in query) {
          if (key === '$or') {
            const orConditions = query[key];
            const matchesOr = orConditions.some(cond => {
              return Object.entries(cond).every(([cKey, val]) => {
                const itemVal = item[cKey];
                if (val instanceof RegExp) {
                  return val.test(itemVal || '');
                }
                return itemVal === val;
              });
            });
            if (!matchesOr) return false;
          } else {
            const val = query[key];
            const itemVal = item[key];
            if (val && typeof val === 'object' && val.$ne !== undefined) {
              if (itemVal === val.$ne) return false;
            } else if (itemVal !== val) {
              return false;
            }
          }
        }
        return true;
      });
    }
    return new LocalQuery(items);
  }

  async findOne(query) {
    const items = this.getAll();
    const item = items.find(it => {
      for (const key in query) {
        if (it[key] !== query[key]) return false;
      }
      return true;
    });
    if (!item) return null;

    const self = this;
    return {
      ...item,
      toObject() {
        const clone = { ...this };
        delete clone.toObject;
        delete clone.save;
        return clone;
      },
      async save() {
        const currentItems = self.getAll();
        const cleanObj = this.toObject();
        const idx = currentItems.findIndex(it => it.id === cleanObj.id || (it.key && it.key === cleanObj.key) || (it.uid && it.uid === cleanObj.uid));
        if (idx !== -1) {
          currentItems[idx] = cleanObj;
        } else {
          currentItems.push(cleanObj);
        }
        self.saveAll(currentItems);
        return this;
      }
    };
  }

  async findOneAndUpdate(query, updates, options = {}) {
    const items = this.getAll();
    let idx = items.findIndex(it => {
      for (const key in query) {
        if (it[key] !== query[key]) return false;
      }
      return true;
    });

    let item;
    let finalUpdates = { ...updates };
    if (updates.$inc) {
      const incs = updates.$inc;
      let existing = {};
      if (idx !== -1) {
        existing = { ...items[idx] };
      }
      for (const key in incs) {
        existing[key] = (existing[key] || 0) + incs[key];
      }
      finalUpdates = { ...finalUpdates, ...existing };
      delete finalUpdates.$inc;
    }

    if (idx !== -1) {
      items[idx] = { ...items[idx], ...finalUpdates, updatedAt: new Date() };
      item = items[idx];
    } else if (options.upsert) {
      item = { ...query, ...finalUpdates, createdAt: new Date(), updatedAt: new Date() };
      if (!item.id && this.tableName !== 'settings' && this.tableName !== 'profile') {
        const { v4: uuidv4 } = await import('uuid');
        item.id = uuidv4();
      }
      items.push(item);
    } else {
      return null;
    }

    this.saveAll(items);
    return {
      ...item,
      toObject() {
        const clone = { ...this };
        delete clone.toObject;
        delete clone.save;
        return clone;
      }
    };
  }

  async deleteOne(query) {
    const items = this.getAll();
    const newItems = items.filter(it => {
      for (const key in query) {
        if (it[key] === query[key]) return false;
      }
      return true;
    });
    const deletedCount = items.length - newItems.length;
    this.saveAll(newItems);
    return { deletedCount, ok: true };
  }

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      this.saveAll([]);
      return { deletedCount: 0, ok: true };
    }
    const items = this.getAll();
    const newItems = items.filter(it => {
      for (const key in query) {
        if (it[key] === query[key]) return false;
      }
      return true;
    });
    this.saveAll(newItems);
    return { ok: true };
  }

  async create(data) {
    const items = this.getAll();
    const newItem = { ...data, createdAt: new Date(), updatedAt: new Date() };
    if (!newItem.id && this.tableName !== 'settings' && this.tableName !== 'profile') {
      const { v4: uuidv4 } = await import('uuid');
      newItem.id = uuidv4();
    }
    items.push(newItem);
    this.saveAll(items);
    return {
      ...newItem,
      toObject() {
        const clone = { ...this };
        delete clone.toObject;
        delete clone.save;
        return clone;
      }
    };
  }

  async updateOne(query, updates) {
    await this.findOneAndUpdate(query, updates);
    return { ok: true };
  }
}
