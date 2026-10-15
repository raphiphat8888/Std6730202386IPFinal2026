const { getPool, TABLE_NAME } = require('./db');

let memoryEmployees = [
  { id: '1', name: 'John Doe', position: 'Software Engineer', status: 'Active', salary: 45000 },
  { id: '2', name: 'Jane Smith', position: 'Product Designer', status: 'Active', salary: 38000 },
  { id: '3', name: 'Mike Johnson', position: 'HR Specialist', status: 'On Leave', salary: 32000 },
  { id: '4', name: 'Sara Wilson', position: 'Finance Analyst', status: 'Active', salary: 52000 },
  { id: '5', name: 'David Brown', position: 'Marketing Manager', status: 'Active', salary: 68000 },
];

const nextId = () => String(Math.max(...memoryEmployees.map((employee) => Number(employee.id)), 0) + 1);

module.exports = {
  all: async () => {
    const pool = await getPool();
    if (pool) {
      const [rows] = await pool.query(`SELECT id, name, position, salary, status FROM \`${TABLE_NAME}\` ORDER BY id ASC`);
      return rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        position: r.position,
        salary: Number(r.salary),
        status: r.status,
      }));
    }
    return memoryEmployees;
  },

  add: async ({ name, position, salary }) => {
    const pool = await getPool();
    if (pool) {
      const [result] = await pool.query(
        `INSERT INTO \`${TABLE_NAME}\` (name, position, salary, status) VALUES (?, ?, ?, 'Active')`,
        [name, position, Number(salary)]
      );
      return {
        id: String(result.insertId),
        name,
        position,
        salary: Number(salary),
        status: 'Active',
      };
    }
    const employee = { id: nextId(), name, position, status: 'Active', salary: Number(salary) };
    memoryEmployees.push(employee);
    return employee;
  },

  toggleStatus: async (id) => {
    const pool = await getPool();
    if (pool) {
      const [rows] = await pool.query(`SELECT id, name, position, salary, status FROM \`${TABLE_NAME}\` WHERE id = ?`, [id]);
      if (!rows.length) return null;
      const current = rows[0];
      const newStatus = current.status === 'Active' ? 'On Leave' : 'Active';
      await pool.query(`UPDATE \`${TABLE_NAME}\` SET status = ? WHERE id = ?`, [newStatus, id]);
      return {
        id: String(current.id),
        name: current.name,
        position: current.position,
        salary: Number(current.salary),
        status: newStatus,
      };
    }
    const employee = memoryEmployees.find((item) => item.id === String(id));
    if (!employee) return null;
    employee.status = employee.status === 'Active' ? 'On Leave' : 'Active';
    return employee;
  },

  remove: async (id) => {
    const pool = await getPool();
    if (pool) {
      const [result] = await pool.query(`DELETE FROM \`${TABLE_NAME}\` WHERE id = ?`, [id]);
      return result.affectedRows > 0;
    }
    const index = memoryEmployees.findIndex((item) => item.id === String(id));
    if (index === -1) return false;
    memoryEmployees.splice(index, 1);
    return true;
  },
};
