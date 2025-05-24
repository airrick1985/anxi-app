function handleLogin(payload) {
  Logger.log("[handleLogin] Handling login for key: " + payload.key + ", projectName: " + payload.projectName);

  const sheet = SpreadsheetApp.openById(FIXED_ACCOUNT_SHEET_ID).getSheetByName('用戶資料');
  const data = sheet.getDataRange().getValues();
  const header = data[0];

  const phoneIndex = header.indexOf('手機號碼');
  const emailIndex = header.indexOf('EMAIL');
  const nameIndex = header.indexOf('NAME');
  const passwordIndex = header.indexOf('密碼');
  const projectIndex = header.indexOf('建案權限'); 
  const permissionsIndex = header.indexOf('功能權限'); // Added: Get permissions column index

  let result = { status: 'not_found', message: '手機號碼不存在或錯誤' };
  let loginStatus = '帳號不存在';
  let userName = '';

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[phoneIndex] === payload.key) {
      userName = row[nameIndex];
      Logger.log("[handleLogin] Found user: " + userName + " for key: " + payload.key);

      if (row[passwordIndex] !== payload.password) {
        result = { status: 'wrong_password', message: '密碼錯誤' };
        loginStatus = '密碼錯誤';
        Logger.log("[handleLogin] Password mismatch for user: " + userName);
        break;
      }
      Logger.log("[handleLogin] Password matched for user: " + userName);

      // Added: Process permissions
      let userPermissions = [];
      if (permissionsIndex !== -1) {
        const rawPermissions = row[permissionsIndex];
        if (rawPermissions && typeof rawPermissions === 'string' && rawPermissions.trim() !== '') {
          userPermissions = rawPermissions.split(',').map(p => p.trim());
          Logger.log("[handleLogin] User " + userName + " raw permissions: '" + rawPermissions + "', parsed: [" + userPermissions.join(', ') + "]");
        } else {
          Logger.log("[handleLogin] User " + userName + " permissions cell is empty, not a string. Defaulting to []. Cell content: " + rawPermissions);
        }
      } else {
        Logger.log("[handleLogin] '功能權限' column not found. Defaulting to [] for user " + userName);
      }

      // If projectName is provided, validate it
      if (payload.projectName) {
        const allowedProjects = (row[projectIndex] || '').split(',').map(p => p.trim());
        const requestedProject = payload.projectName;
        Logger.log("[handleLogin] User " + userName + " allowed projects: [" + allowedProjects.join(', ') + "], requested: " + requestedProject);

        if (!allowedProjects.includes(requestedProject)) {
          result = { status: 'no_permission', message: '無此建案權限' };
          loginStatus = '建案權限不足';
          Logger.log("[handleLogin] Permission denied for user: " + userName + " on project: " + requestedProject);
          break; 
        }
        Logger.log("[handleLogin] Permission granted for user: " + userName + " on project: " + requestedProject);
        result = {
          status: 'success',
          user: {
            key: row[phoneIndex],
            email: row[emailIndex],
            name: row[nameIndex],
            projectName: payload.projectName,
            permissions: userPermissions // Added: permissions
          }
        };
      } else {
        Logger.log("[handleLogin] Basic login successful for user: " + userName + ". No specific project selected at login.");
        result = {
          status: 'success',
          user: {
            key: row[phoneIndex],
            email: row[emailIndex],
            name: row[nameIndex],
            projectName: null, 
            permissions: userPermissions // Added: permissions
          }
        };
      }
      loginStatus = '成功';
      Logger.log("[handleLogin] Login process completed for user: " + userName + ". Returning user data: " + JSON.stringify(result.user));
      break; 
    }
  }

  logLoginRecord(userName || payload.key, loginStatus, payload.userAgent, payload.ip);
  return createJsonResponse(result);
}
