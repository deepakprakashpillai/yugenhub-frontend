/**
 * RBAC (Role-Based Access Control) Configuration
 * 
 * Centralized permission definitions for the application.
 * To add new permissions:
 * 1. Add to PERMISSIONS object
 * 2. Add to relevant role arrays in ROLE_PERMISSIONS
 */

export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
    CLIENT: 'client'
};

export const PERMISSIONS = {
    // Calendar
    VIEW_ALL_CALENDAR: 'view_all_calendar',

    // Tasks
    VIEW_ALL_TASKS: 'view_all_tasks',

    // Users
    MANAGE_USERS: 'manage_users',

    // Projects
    CREATE_PROJECT: 'create_project',
    DELETE_PROJECT: 'delete_project',
};

/**
 * Role -> Permissions mapping
 * Each role has an array of permissions they are granted.
 */
export const ROLE_PERMISSIONS = {
    [ROLES.OWNER]: [
        PERMISSIONS.VIEW_ALL_CALENDAR,
        PERMISSIONS.VIEW_ALL_TASKS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.DELETE_PROJECT,
    ],
    [ROLES.ADMIN]: [
        PERMISSIONS.VIEW_ALL_CALENDAR,
        PERMISSIONS.VIEW_ALL_TASKS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.DELETE_PROJECT,
    ],
    [ROLES.MEMBER]: [
        PERMISSIONS.CREATE_PROJECT,
    ],
    [ROLES.CLIENT]: [
        // Clients have limited access
    ]
};
