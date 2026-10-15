import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from './src/services/api';
import KMeansScatterPlot from './src/components/KMeansScatterPlot';

const money = (val) => `${Number(val || 0).toLocaleString('en-US')} THB`;

// Refined Palette (Modern Slate / Indigo Enterprise Theme)
const c = {
  bg: '#0B0F19',
  surface: '#111827',
  surfaceHover: '#1A2234',
  surfaceAlt: '#1F2937',
  border: '#2A3447',
  borderLight: '#374151',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  brand: '#4F46E5',
  brandHover: '#4338CA',
  brandLight: '#EEF2FF',
  emerald: '#10B981',
  emeraldBg: '#064E3B',
  amber: '#F59E0B',
  amberBg: '#78350F',
  rose: '#EF4444',
  roseBg: '#7F1D1D',
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [clusters, setClusters] = useState(null);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalEmployee, setEditModalEmployee] = useState(null);
  const [deleteModalEmployee, setDeleteModalEmployee] = useState(null);

  // Forms state
  const [createForm, setCreateForm] = useState({ name: '', position: '', salary: '' });
  const [editForm, setEditForm] = useState({ name: '', position: '', salary: '', status: 'Active' });
  const [formError, setFormError] = useState('');

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.employees();
      setEmployees(data || []);
    } catch (err) {
      notify(`Error loading employees: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) loadEmployees();
  }, [loggedIn]);

  const notify = (msg) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    }
  };

  // Login Screen
  if (!loggedIn) {
    return <LoginView onSuccess={() => setLoggedIn(true)} />;
  }

  // --- Actions ---
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.position.trim() || !createForm.salary.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    const numSalary = Number(createForm.salary);
    if (!Number.isFinite(numSalary) || numSalary < 0) {
      setFormError('Salary must be a positive number.');
      return;
    }
    try {
      await api.createEmployee({
        name: createForm.name.trim(),
        position: createForm.position.trim(),
        salary: numSalary,
      });
      setCreateForm({ name: '', position: '', salary: '' });
      setFormError('');
      setCreateModalOpen(false);
      setClusters(null);
      await loadEmployees();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const openEdit = (emp) => {
    setEditModalEmployee(emp);
    setEditForm({
      name: emp.name,
      position: emp.position,
      salary: String(emp.salary),
      status: emp.status,
    });
    setFormError('');
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim() || !editForm.position.trim() || !editForm.salary.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }
    const numSalary = Number(editForm.salary);
    if (!Number.isFinite(numSalary) || numSalary < 0) {
      setFormError('Salary must be a valid number.');
      return;
    }
    try {
      await api.updateEmployee(editModalEmployee.id, {
        name: editForm.name.trim(),
        position: editForm.position.trim(),
        salary: numSalary,
        status: editForm.status,
      });
      setEditModalEmployee(null);
      setFormError('');
      setClusters(null);
      await loadEmployees();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleToggle = async (emp) => {
    try {
      await api.toggleStatus(emp.id);
      setClusters(null);
      await loadEmployees();
    } catch (err) {
      notify(`Could not update status: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalEmployee) return;
    try {
      await api.deleteEmployee(deleteModalEmployee.id);
      setDeleteModalEmployee(null);
      setClusters(null);
      await loadEmployees();
    } catch (err) {
      notify(`Could not delete employee: ${err.message}`);
    }
  };

  const handleAnalyze = async () => {
    setClusterLoading(true);
    try {
      const data = await api.salaryClusters();
      setClusters(data.clusters);
    } catch (err) {
      notify(`Clustering failed: ${err.message}`);
    } finally {
      setClusterLoading(false);
    }
  };

  // Metrics
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const leaveCount = employees.length - activeCount;
  const totalPayroll = employees.reduce((s, e) => s + Number(e.salary || 0), 0);
  const avgSalary = employees.length ? Math.round(totalPayroll / employees.length) : 0;

  // Filtered employees
  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.appContainer}>
      <ScrollView contentContainerStyle={styles.scrollArea}>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <View style={styles.navBrand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandLetter}>P</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>PeopleHR Analytics</Text>
              <Text style={styles.brandSubtitle}>Compensation & Workforce Management</Text>
            </View>
          </View>

          <View style={styles.navActions}>
            <View style={styles.dbStatusPill}>
              <View style={styles.dbStatusDot} />
              <Text style={styles.dbStatusText}>Cloud MySQL (119.59.102.161)</Text>
            </View>
            <Pressable style={styles.signOutBtn} onPress={() => setLoggedIn(false)}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>

        {/* Executive Stats Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL HEADCOUNT</Text>
            <Text style={styles.kpiValue}>{employees.length}</Text>
            <Text style={styles.kpiSub}>Registered workforce</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE PERSONNEL</Text>
            <Text style={[styles.kpiValue, { color: c.emerald }]}>{activeCount}</Text>
            <Text style={styles.kpiSub}>{leaveCount} on leave</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>MONTHLY PAYROLL</Text>
            <Text style={styles.kpiValue}>{money(totalPayroll)}</Text>
            <Text style={styles.kpiSub}>Gross salary expense</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>AVERAGE BASE SALARY</Text>
            <Text style={styles.kpiValue}>{money(avgSalary)}</Text>
            <Text style={styles.kpiSub}>Across all departments</Text>
          </View>
        </View>

        {/* Actions Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or position..."
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.toolbarRight}>
            <Pressable style={styles.secondaryBtn} onPress={handleAnalyze} disabled={clusterLoading}>
              {clusterLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.secondaryBtnText}>📊 Analyze Salary (K-Means)</Text>
              )}
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => setCreateModalOpen(true)}>
              <Text style={styles.primaryBtnText}>+ Add Employee</Text>
            </Pressable>
          </View>
        </View>

        {/* K-Means 2D Scatter Plot Section (if analyzed) */}
        {clusters && (
          <View style={styles.sectionCard}>
            <KMeansScatterPlot
              clusters={clusters}
              employees={employees}
              selectedCluster={selectedCluster}
              onSelectCluster={setSelectedCluster}
            />
          </View>
        )}

        {/* Employee Directory Section */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <View>
              <Text style={styles.sectionHeading}>Employee Directory</Text>
              <Text style={styles.sectionSubtitle}>
                Showing {filtered.length} of {employees.length} records
              </Text>
            </View>
          </View>

          {/* Table Header Row */}
          <View style={styles.thRow}>
            <Text style={[styles.thText, { flex: 2 }]}>EMPLOYEE</Text>
            <Text style={[styles.thText, { flex: 1.5 }]}>POSITION</Text>
            <Text style={[styles.thText, { flex: 1.2 }]}>SALARY</Text>
            <Text style={[styles.thText, { flex: 1 }]}>STATUS</Text>
            <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>ACTIONS</Text>
          </View>

          {/* Table Body */}
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={c.brand} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyText}>No employees found.</Text>
            </View>
          ) : (
            filtered.map((emp) => (
              <View key={emp.id} style={styles.trRow}>
                {/* Employee Info */}
                <View style={[styles.tdCol, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.avatarInitial}>{(emp.name || 'E')[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.empNameText}>{emp.name}</Text>
                    <Text style={styles.empIdText}>ID: #{emp.id}</Text>
                  </View>
                </View>

                {/* Position */}
                <View style={[styles.tdCol, { flex: 1.5 }]}>
                  <Text style={styles.positionText}>{emp.position}</Text>
                </View>

                {/* Salary */}
                <View style={[styles.tdCol, { flex: 1.2 }]}>
                  <Text style={styles.salaryText}>{money(emp.salary)}</Text>
                </View>

                {/* Status Toggle */}
                <View style={[styles.tdCol, { flex: 1 }]}>
                  <Pressable
                    style={[
                      styles.statusPill,
                      emp.status === 'Active' ? styles.statusActive : styles.statusLeave,
                    ]}
                    onPress={() => handleToggle(emp)}
                  >
                    <View
                      style={[
                        styles.statusDotSmall,
                        { backgroundColor: emp.status === 'Active' ? c.emerald : c.amber },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: emp.status === 'Active' ? '#6EE7B7' : '#FCD34D' },
                      ]}
                    >
                      {emp.status}
                    </Text>
                  </Pressable>
                </View>

                {/* Action Buttons: Edit & Delete */}
                <View style={[styles.tdCol, { flex: 1.5, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }]}>
                  <Pressable style={styles.actionBtnEdit} onPress={() => openEdit(emp)}>
                    <Text style={styles.actionBtnEditText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtnDelete}
                    onPress={() => setDeleteModalEmployee(emp)}
                  >
                    <Text style={styles.actionBtnDeleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footerNote}>
          PEOPLEHR ANALYTICS  •  BACKEND ON 119.59.102.161:3037  •  DATABASE: ip_std6730202386
        </Text>
      </ScrollView>

      {/* --- MODAL: ADD EMPLOYEE --- */}
      <Modal visible={createModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Employee</Text>
            <Text style={styles.modalSub}>Create a new employee record stored directly in MySQL.</Text>

            {formError ? <Text style={styles.modalError}>{formError}</Text> : null}

            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Somchai Prasert"
              placeholderTextColor={c.textMuted}
              value={createForm.name}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, name: v }))}
            />

            <Text style={styles.fieldLabel}>JOB POSITION</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Senior Software Engineer"
              placeholderTextColor={c.textMuted}
              value={createForm.position}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, position: v }))}
            />

            <Text style={styles.fieldLabel}>MONTHLY SALARY (THB)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 55000"
              keyboardType="numeric"
              placeholderTextColor={c.textMuted}
              value={createForm.salary}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, salary: v }))}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setCreateModalOpen(false);
                  setFormError('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleCreate}>
                <Text style={styles.modalSubmitText}>Save Employee</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: EDIT EMPLOYEE --- */}
      <Modal visible={!!editModalEmployee} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Employee Record</Text>
            <Text style={styles.modalSub}>Update employee details in the cloud database.</Text>

            {formError ? <Text style={styles.modalError}>{formError}</Text> : null}

            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Full name"
              placeholderTextColor={c.textMuted}
              value={editForm.name}
              onChangeText={(v) => setEditForm((f) => ({ ...f, name: v }))}
            />

            <Text style={styles.fieldLabel}>JOB POSITION</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Position"
              placeholderTextColor={c.textMuted}
              value={editForm.position}
              onChangeText={(v) => setEditForm((f) => ({ ...f, position: v }))}
            />

            <Text style={styles.fieldLabel}>MONTHLY SALARY (THB)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Salary"
              keyboardType="numeric"
              placeholderTextColor={c.textMuted}
              value={editForm.salary}
              onChangeText={(v) => setEditForm((f) => ({ ...f, salary: v }))}
            />

            <Text style={styles.fieldLabel}>EMPLOYMENT STATUS</Text>
            <View style={styles.statusSelectRow}>
              <Pressable
                style={[
                  styles.statusChoice,
                  editForm.status === 'Active' && styles.statusChoiceActive,
                ]}
                onPress={() => setEditForm((f) => ({ ...f, status: 'Active' }))}
              >
                <Text
                  style={[
                    styles.statusChoiceText,
                    editForm.status === 'Active' && { color: c.emerald, fontWeight: '700' },
                  ]}
                >
                  ● Active
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.statusChoice,
                  editForm.status === 'On Leave' && styles.statusChoiceActive,
                ]}
                onPress={() => setEditForm((f) => ({ ...f, status: 'On Leave' }))}
              >
                <Text
                  style={[
                    styles.statusChoiceText,
                    editForm.status === 'On Leave' && { color: c.amber, fontWeight: '700' },
                  ]}
                >
                  ● On Leave
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setEditModalEmployee(null);
                  setFormError('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitBtn} onPress={handleUpdate}>
                <Text style={styles.modalSubmitText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: CONFIRM DELETE --- */}
      <Modal visible={!!deleteModalEmployee} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxWidth: 420 }]}>
            <View style={styles.deleteWarningIcon}>
              <Text style={{ fontSize: 24 }}>🗑️</Text>
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Delete Employee?</Text>
            <Text style={[styles.modalSub, { textAlign: 'center', marginTop: 8 }]}>
              Are you sure you want to permanently remove{' '}
              <Text style={{ color: c.text, fontWeight: '700' }}>
                {deleteModalEmployee?.name}
              </Text>{' '}
              from the system? This action cannot be undone.
            </Text>

            <View style={[styles.modalBtnRow, { marginTop: 24 }]}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalEmployee(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSubmitBtn, { backgroundColor: c.rose }]}
                onPress={handleDelete}
              >
                <Text style={styles.modalSubmitText}>Delete Permanently</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Login Component
function LoginView({ onSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.login(username, password);
      onSuccess();
    } catch (e) {
      setErr(e.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginBg}>
      <View style={styles.loginBox}>
        <View style={styles.brandIconLarge}>
          <Text style={styles.brandLetterLarge}>P</Text>
        </View>
        <Text style={styles.loginHeader}>PeopleHR</Text>
        <Text style={styles.loginSub}>Enter your credentials to access the analytics suite</Text>

        {err ? <Text style={styles.loginError}>{err}</Text> : null}

        <Text style={styles.fieldLabel}>USERNAME</Text>
        <TextInput
          style={styles.modalInput}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="admin"
          placeholderTextColor={c.textMuted}
        />

        <Text style={styles.fieldLabel}>PASSWORD</Text>
        <TextInput
          style={styles.modalInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={c.textMuted}
        />

        <Pressable style={styles.loginSubmitBtn} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginSubmitText}>Sign In to Dashboard →</Text>
          )}
        </Pressable>

        <View style={styles.demoPill}>
          <Text style={styles.demoText}>Default login: admin / password123</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: c.bg },
  scrollArea: { paddingHorizontal: 24, paddingVertical: 24, maxWidth: 1240, width: '100%', alignSelf: 'center' },

  // Navbar
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    marginBottom: 24,
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  brandTitle: { color: c.text, fontSize: 18, fontWeight: '800' },
  brandSubtitle: { color: c.textSecondary, fontSize: 12, marginTop: 1 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dbStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F291E',
    borderWidth: 1,
    borderColor: '#065F46',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dbStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.emerald },
  dbStatusText: { color: '#6EE7B7', fontSize: 11, fontWeight: '600' },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
  },
  signOutText: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },

  // KPI Row
  kpiRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  kpiCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: c.border,
  },
  kpiLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  kpiValue: { color: c.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  kpiSub: { color: c.textSecondary, fontSize: 12, marginTop: 4 },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { marginRight: 8, fontSize: 14 },
  searchInput: { flex: 1, color: c.text, fontSize: 13 },
  toolbarRight: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    backgroundColor: c.brand,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.borderLight,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: c.text, fontSize: 13, fontWeight: '600' },

  // Section Card
  sectionCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 24,
  },

  // Directory Table Card
  tableCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  tableCardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  sectionHeading: { color: c.text, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  thRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: c.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  thText: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  tdCol: { justifyContent: 'center' },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: { color: '#E0E7FF', fontSize: 14, fontWeight: '700' },
  empNameText: { color: c.text, fontSize: 14, fontWeight: '700' },
  empIdText: { color: c.textMuted, fontSize: 11, marginTop: 1 },
  positionText: { color: c.textSecondary, fontSize: 13 },
  salaryText: { color: '#34D399', fontSize: 14, fontWeight: '700' },

  // Status Pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: { backgroundColor: '#064E3B' },
  statusLeave: { backgroundColor: '#78350F' },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  // Action Buttons
  actionBtnEdit: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  actionBtnEditText: { color: '#818CF8', fontSize: 12, fontWeight: '600' },
  actionBtnDelete: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3F171A',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  actionBtnDeleteText: { color: '#F87171', fontSize: 12, fontWeight: '600' },

  emptyTable: { padding: 40, alignItems: 'center' },
  emptyText: { color: c.textMuted, fontSize: 14 },
  footerNote: { color: c.textMuted, fontSize: 11, textAlign: 'center', marginVertical: 32, letterSpacing: 0.5 },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 26,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  modalTitle: { color: c.text, fontSize: 20, fontWeight: '800' },
  modalSub: { color: c.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 18 },
  fieldLabel: { color: c.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  modalInput: {
    backgroundColor: c.bg,
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  modalError: { color: '#F87171', fontSize: 12, marginBottom: 14, fontWeight: '600' },
  statusSelectRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statusChoice: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    backgroundColor: c.bg,
  },
  statusChoiceActive: { borderColor: c.brand, backgroundColor: c.surfaceAlt },
  statusChoiceText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: c.surfaceAlt },
  modalCancelText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
  modalSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: c.brand,
  },
  modalSubmitText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  deleteWarningIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#37181C',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },

  // Login Screen Styles
  loginBg: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loginBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 32,
    borderWidth: 1,
    borderColor: c.border,
  },
  brandIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  brandLetterLarge: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  loginHeader: { color: c.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  loginSub: { color: c.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  loginError: {
    backgroundColor: '#3B1518',
    color: '#F87171',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  loginSubmitBtn: {
    backgroundColor: c.brand,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginSubmitText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  demoPill: { marginTop: 20, alignItems: 'center' },
  demoText: { color: c.textMuted, fontSize: 12 },
});
