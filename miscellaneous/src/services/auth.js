const USERS_KEY = 'fleetmind_users'
const CURRENT_USER_KEY = 'fleetmind_current_user'

// Helper: load all users from localStorage
function loadUsers() {
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : {}
}

// Helper: save all users
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Register a new user
export function registerUser(role, userData) {
  const users = loadUsers()
  const key = `${role}_${userData.id}`
  if (users[key]) {
    throw new Error('User already exists')
  }
  users[key] = { role, ...userData }
  saveUsers(users)
  // Auto login after registration
  setCurrentUser({ role, id: userData.id })
  return true
}

// Login user
export function loginUser(role, id, password) {
  const users = loadUsers()
  const key = `${role}_${id}`
  const user = users[key]
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials')
  }
  setCurrentUser({ role, id })
  return user
}

// Set current logged-in user
export function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

// Get current logged-in user
export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_USER_KEY)
  return data ? JSON.parse(data) : null
}

// Logout
export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

// Check if user is authenticated
export function isAuthenticated() {
  return getCurrentUser() !== null
}

// Get user role
export function getUserRole() {
  const user = getCurrentUser()
  return user ? user.role : null
}