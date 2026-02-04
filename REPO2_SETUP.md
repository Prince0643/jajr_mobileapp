# Repo 2 Setup (Web/API) — Instructions to Continue in Another Chat

> Use this file as a prompt in another chat session to configure Repo 2 (the web/API repo) and keep it in sync with the mobile app’s expectations.

---

## 1) Repository Structure

- **Repo 2** should contain the PHP files that the mobile app calls.
- Typical deployment path on the server: `attendance_web/` (or whatever your server uses).
- Ensure the following files exist and are deployed to the same base URL that the mobile app uses (`EXPO_PUBLIC_API_URL`).

### Files to copy from Repo 1 (`apifromphp/`) to Repo 2
```
apifromphp/time_in_api.php      → <repo2>/attendance_web/time_in_api.php
apifromphp/time_out_api.php     → <repo2>/attendance_web/time_out_api.php
apifromphp/select_employee.php → <repo2>/attendance_web/select_employee.php
apifromphp/db_connection.php    → <repo2>/attendance_web/conn/db_connection.php
```

If your Repo 2 uses a different folder layout, adjust the destination accordingly.

---

## 2) Server Timezone (PHT)

- **Requirement**: All API date/time operations must use **Asia/Manila (UTC+08:00)**.
- In `db_connection.php` (or equivalent), ensure:
  ```php
  date_default_timezone_set('Asia/Manila');
  // After mysqli_connect:
  @mysqli_query($db, "SET time_zone = '+08:00'");
  ```

---

## 3) Multi-Session Per Day (Option A)

- The mobile app expects **multiple attendance rows per day** (one per Time In/Out pair).
- `time_in_api.php` must **INSERT a new row** for each new Time In (as long as there’s no open session).
- `time_out_api.php` must **UPDATE the latest open row** for today (`time_out IS NULL`).

- Both files should gracefully handle the case where the `is_time_running` column does not exist.

---

## 4) Endpoint Paths the Mobile App Calls

The mobile app constructs URLs like:
```
${EXPO_PUBLIC_API_URL}/time_in_api.php
${EXPO_PUBLIC_API_URL}/time_out_api.php
${EXPO_PUBLIC_API_URL}/select_employee.php
```

- Ensure these are reachable at the same base URL (e.g. `https://yourdomain.com/attendance_web/`).
- If you use a different path, update `EXPO_PUBLIC_API_URL` in the mobile app’s `.env` or build config.

---

## 5) CORS/Headers (if needed)

If you ever serve these APIs from a different origin than the mobile app’s web assets, ensure:
- `Access-Control-Allow-Origin: *` (or specific origin)
- `Content-Type: application/json` is set in responses.

---

## 6) Testing Checklist

Deploy and test:
- [ ] Time In creates a new row and returns `success: true`
- [ ] Time Out updates the latest open row and returns `success: true`
- [ ] `select_employee.php?action=get_shift_logs` returns all rows for today (multiple sessions)
- [ ] All timestamps are in PHT
- [ ] Mobile app can call all three endpoints without 404/500

---

## 7) Optional: Automation (if you update often)

If you plan to update API files frequently, consider:
- **Git Submodule**: Make `apifromphp/` in Repo 1 a submodule pointing to Repo 2.
- **CI/CD**: On push to Repo 2’s main branch, auto-deploy to the server `attendance_web/` path.

---

## 8) Prompt to Continue

> “I’m setting up Repo 2 (web/API repo). The mobile app expects the following endpoints under the same base URL: `time_in_api.php`, `time_out_api.php`, `select_employee.php`. The server must use Asia/Manila timezone and support multiple attendance rows per day. Please help me set up the repo structure, deployment path, and ensure the PHP files are correctly placed and configured.”
