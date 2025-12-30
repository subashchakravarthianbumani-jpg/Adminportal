import db from '../libs/db.js';


export async function logAction({
  ReferID = '',
  Description = '',
  ModuleName = '',
  Action = '',
  OldData = null,
  NewData = null,
  ErrorException = null,
  IPAddress = '',
  UserID = '',
  UserName = '',
}) {
  try {
    const sql = `
      INSERT INTO tbl_log
      (LogID, ReferID, Description, ModuleName, Action, OldData, NewData, ErrorException, IPAddress, UserID, UserName, LogTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const LogID = require('uuid').v4();

    const params = [

      LogID,
      ReferID,
      Description,
      ModuleName,
      Action,
      OldData,
      NewData,
      ErrorException,
      IPAddress,
      UserID,
      UserName,
    ];

    await db.execute(sql, params);
  } catch (err) {
    console.error('Logging failed:', err.message);
  }
}
