package com.ntmi.support.model;

public enum Role {
    ADMIN,          // The IT Support Officer handling the ticket
    BRANCH_USER,    // The employee reporting the issue
    SUPER_ADMIN,    // ✅ NEW: Technical Head (Approves repairs)
    ACCOUNT_HEAD    // ✅ NEW: Finance Head (Approves funds)
}