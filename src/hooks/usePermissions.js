import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../config/permissions';

/**
 * Hook to check if current user has a specific permission
 * @param {string} permission - Permission to check (from PERMISSIONS)
 * @returns {boolean} - True if user has the permission
 */
export const usePermission = (permission) => {
    const { user } = useAuth();

    if (!user || !user.role) return false;

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
};

/**
 * Hook to check if current user has ANY of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has at least one permission
 */
export const useAnyPermission = (permissions) => {
    const { user } = useAuth();

    if (!user || !user.role) return false;

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.some(p => userPermissions.includes(p));
};

/**
 * Hook to check if current user has ALL of the specified permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has all permissions
 */
export const useAllPermissions = (permissions) => {
    const { user } = useAuth();

    if (!user || !user.role) return false;

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.every(p => userPermissions.includes(p));
};
