# Procurement System Workflow - Multi-Step Approval Process

## Overview
This document outlines the complete purchase request approval workflow with multiple role-based stages.

## Workflow Stages

### Stage 1: Engineer Creates PR
**Role:** Engineer
**Actions:**
- Browse items catalog
- Select items with quantities
- Fill purpose, date needed, project, project address
- Submit Purchase Request (PR)
- Status: **"Pending"**

**API Endpoint:** `POST /api/purchase-requests`

---

### Stage 2: Super Admin Initial Review
**Role:** Super Admin
**Actions:**
- View all pending PRs
- Review PR details (purpose, items, quantities)
- **Approve:** PR moves to Procurement review (Status: **"For Procurement Review"**)
- **Reject:** PR is rejected (Status: **"Rejected"**)

**UI Features:**
- "Approve for Procurement" button
- "Reject" button (with rejection reason input)

**API Endpoints:**
- `GET /api/purchase-requests/super-admin` (view all pending PRs)
- `PUT /api/purchase-requests/:id/super-admin-approve`
- `PUT /api/purchase-requests/:id/reject`

---

### Stage 3: Procurement Review
**Role:** Procurement Officer
**Actions:**
- View PRs approved by Super Admin
- Review item specifications
- **Set Unit Cost** for each item
- **Select Supplier** (dropdown from supplier database)
- **Auto-display Supplier Address** when supplier selected
- **Approve:** PR moves to Super Admin final approval (Status: **"For Super Admin Final Approval"**)
- **Reject:** PR is rejected with reason

**UI Features:**
- PR detail view with editable unit cost fields per item
- Supplier dropdown selector
- Auto-populated supplier address display
- Total cost auto-calculation
- "Approve for Final Review" button
- "Reject" button

**API Endpoints:**
- `GET /api/purchase-requests/procurement` (view PRs for procurement review)
- `PUT /api/purchase-requests/:id/procurement-approve` (with unit_costs and supplier_id)
- `GET /api/suppliers` (for supplier dropdown)
- `GET /api/suppliers/:id` (for supplier address)

**Database Schema:**
```sql
-- Supplier selection stored in purchase_requests
ALTER TABLE purchase_requests ADD COLUMN supplier_id INT;
ALTER TABLE purchase_requests ADD COLUMN supplier_address VARCHAR(255);

-- Unit costs stored in purchase_request_items
ALTER TABLE purchase_request_items ADD COLUMN unit_price DECIMAL(10,2);
ALTER TABLE purchase_request_items ADD COLUMN total_price DECIMAL(10,2);
```

---

### Stage 4: Super Admin Final Approval
**Role:** Super Admin
**Actions:**
- View PRs with unit costs and supplier info
- Review final pricing
- **Approve:** PR approved for PO creation (Status: **"For Purchase"**)
- **Reject:** PR rejected with reason

**UI Features:**
- PR detail with all pricing information
- "Final Approve" button
- "Reject" button

**API Endpoints:**
- `GET /api/purchase-requests/super-admin/final-approval`
- `PUT /api/purchase-requests/:id/final-approve`

---

### Stage 5: Admin Creates PO
**Role:** Admin
**Actions:**
- View approved PRs ready for PO
- **Create Purchase Order (PO)** from approved PR
- PO auto-generates PO number
- PO linked to PR
- Status: **"PO Created"**

**UI Features:**
- "Create PO" button on approved PRs
- PO confirmation screen
- View generated PO with PO number

**API Endpoints:**
- `GET /api/purchase-requests/admin/for-po`
- `POST /api/purchase-orders` (create from PR)

**Database Schema:**
```sql
-- Purchase Orders table
CREATE TABLE purchase_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_number VARCHAR(50) UNIQUE,
  pr_id INT,
  supplier_id INT,
  total_amount DECIMAL(10,2),
  status ENUM('pending', 'approved', 'sent', 'received'),
  created_by INT,
  created_at TIMESTAMP
);
```

---

## Status Flow Diagram

```
[Engineer] Creates PR
      |
      v
[PENDING] --> [Super Admin]
                  |
     Rejected <---|---> Approve
                         |
                         v
           [FOR PROCUREMENT REVIEW] --> [Procurement]
                                         |
                        Rejected <-------|-------> Approve
                                               |
                                               v
                             [FOR SUPER ADMIN FINAL] --> [Super Admin]
                                                           |
                                          Rejected <-------|-------> Final Approve
                                                                     |
                                                                     v
                                                      [FOR PURCHASE] --> [Admin]
                                                                           |
                                                                           v
                                                                   [PO CREATED]
```

---

## Status Definitions

| Status | Description | Next Action By |
|--------|-------------|----------------|
| Pending | Engineer submitted PR, awaiting Super Admin review | Super Admin |
| Rejected | PR was rejected at any stage | Engineer (create new PR) |
| For Procurement Review | Super Admin approved, awaiting procurement pricing | Procurement |
| For Super Admin Final | Procurement set pricing, awaiting final approval | Super Admin |
| For Purchase | Fully approved, awaiting PO creation | Admin |
| PO Created | PO generated from PR | - (Complete) |

---

## Mobile App UI Requirements by Role

### Engineer View
- Tab: "Items" - Browse and select items
- Tab: "My PRs" - View created PRs and their status
- Cannot see other users' PRs

### Super Admin View
- Tab: "Pending Review" - Initial approval queue
- Tab: "Final Approval" - Final approval queue
- Tab: "All PRs" - Complete PR list with filters

### Procurement View
- Tab: "For Review" - PRs needing pricing/supplier
- Tab: "My Actions" - PRs procurement has processed
- Item pricing interface with unit cost input
- Supplier selection dropdown

### Admin View
- Tab: "Create PO" - Approved PRs ready for PO
- Tab: "All POs" - List of created purchase orders
- PO creation interface

---

## Implementation Notes

### Priority Order
1. Implement Engineer role (current - DONE)
2. Implement Super Admin initial approval
3. Implement Procurement review with pricing
4. Implement Super Admin final approval
5. Implement Admin PO creation

### Required API Endpoints
Need to verify/create:
- Role-based PR list endpoints
- Approval endpoints with status transitions
- Supplier management endpoints
- PO creation endpoints

### Mobile UI Changes Needed
- Add role detection on procurement screen load
- Show/hide tabs based on role
- Different PR detail views per role
- Approval action buttons (approve/reject)
- Pricing input interface
- Supplier selection interface

---

## Current Implementation Status

✅ **Engineer Role** - COMPLETE
- Browse items
- Create PR
- View My PRs

⏳ **Super Admin Role** - PENDING
- Initial approval interface
- Final approval interface
- Reject with reason

⏳ **Procurement Role** - PENDING
- Review queue
- Unit cost input
- Supplier selection
- Address auto-display

⏳ **Admin Role** - PENDING
- PO creation interface
- PO number generation
- PO list view
