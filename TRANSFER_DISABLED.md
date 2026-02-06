# Transfer Employees (Attendance) — Temporarily Disabled

## Status
The **Transfer Employees** UI in the Attendance screen is intentionally **disabled for now**. We will implement/enable it later.

## Where it was disabled
- `components/BranchEmployeeSearchList.tsx`

The Transfer button is controlled by the `onTransfer` prop passed to `EmployeeListItem`. It is currently set to `undefined`, which hides the Transfer UI.

## How to re-enable later
### 1) Re-enable the `onTransfer` prop in the list

File:
- `components/BranchEmployeeSearchList.tsx`

Find the `EmployeeListItem` render and change this:

```tsx
onTransfer={undefined}
```

Back to a conditional handler like this:

```tsx
onTransfer={
  employee.is_time_running && typeof onEmployeeTransfer === 'function'
    ? () => onEmployeeTransfer(employee, branch)
    : undefined
}
```

Notes:
- This makes the Transfer UI appear **only** for employees who are currently **timed in and running** (`is_time_running` truthy).
- `EmployeeListItem` is already designed to hide the Transfer button when `onTransfer` is `undefined`.

### 2) Ensure the Attendance screen passes a transfer handler

File (Attendance tab):
- `app/(tabs)/home.tsx`

Make sure wherever `BranchEmployeeSearchList` is used, it receives an `onEmployeeTransfer` prop, e.g.:

```tsx
<BranchEmployeeSearchList
  ...
  onEmployeeTransfer={handleEmployeeTransfer}
/>
```

If `onEmployeeTransfer` is not passed, the button will still stay hidden because the condition checks `typeof onEmployeeTransfer === 'function'`.

### 3) Confirm the transfer flow is ready (before enabling in production)

Before turning it back on for users, confirm these are correct:
- The transfer modal / selector (target branch) is working.
- Backend endpoint is reachable and returns `success: true`.
- For **timed-in employees**, transfer should:
  - Time out the current running attendance record.
  - Create a new time-in record for the target branch (if that is the intended behavior).
  - Update `employees.branch_id`.
- For **not timed-in employees**, transfer should:
  - Only update `employees.branch_id`.

### 4) Quick UI verification checklist

After re-enabling:
- Transfer button only appears for **running** employees.
- After transfer, the employee moves to the new branch section (after refresh / reload).
- Present/Absent counts and filters remain correct.
