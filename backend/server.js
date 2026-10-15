require('dotenv').config();
const express = require('express');
const cors = require('cors');
const employeeStore = require('./employees');
const { salaryClusters } = require('./clustering');
const { authenticate } = require('./auth');
const { isDbConnected } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const validateEmployee = (body) => {
  const name = String(body.name || '').trim();
  const position = String(body.position || '').trim();
  const salary = Number(body.salary);
  if (!name || !position || body.salary === '' || !Number.isFinite(salary) || salary < 0) {
    return 'name, position, and salary are required. Salary must be a non-negative number.';
  }
  return null;
};

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    dbConnected: isDbConnected(),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/login', (req, res) => {
  if (!authenticate(req.body.username, req.body.password)) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }
  return res.json({ success: true, token: 'mock-jwt-token' });
});

app.get('/api/employees', async (req, res) => {
  try {
    const list = await employeeStore.all();
    res.json(list);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const error = validateEmployee(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  try {
    const created = await employeeStore.add({
      name: req.body.name.trim(),
      position: req.body.position.trim(),
      salary: Number(req.body.salary)
    });
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/employees/:id/status', async (req, res) => {
  try {
    const employee = await employeeStore.toggleStatus(req.params.id);
    return employee ? res.json(employee) : res.status(404).json({ success: false, message: 'Employee not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const success = await employeeStore.remove(req.params.id);
    return success ? res.status(204).send() : res.status(404).json({ success: false, message: 'Employee not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/employees/salary-clusters', async (req, res) => {
  try {
    const employees = await employeeStore.all();
    return res.json({ success: true, clusters: salaryClusters(employees, 3) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Employee API running at http://localhost:${PORT}`));
