export const TEST_DB = {
  container: 'pafe-test-pg',
  port: 55432,
  user: 'pafe_test',
  password: 'pafe_test',
  database: 'pafe_test',
}

export const TEST_DATABASE_URL = `postgresql://${TEST_DB.user}:${TEST_DB.password}@127.0.0.1:${TEST_DB.port}/${TEST_DB.database}`
