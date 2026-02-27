import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const Login = () => {
    const { loginWithGoogle, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { theme } = useTheme();

    // If already logged in, redirect (can also be handled by a PublicRoute wrapper)
    if (isAuthenticated) {
        setTimeout(() => navigate('/'), 0);
        return null;
    }

    const handleSuccess = async (credentialResponse) => {
        const result = await loginWithGoogle(credentialResponse);
        if (result.success) {
            navigate('/');
        } else {
            toast.error(`Login Failed: ${result.error}`);
        }
    };

    const handleError = () => {
        console.log('Login Failed');
        toast.error("Google Login failed to initialize.");
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen ${theme.canvas.bg} ${theme.text.primary} p-4`}>
            <div className={`w-full max-w-md p-8 space-y-8 ${theme.canvas.card} rounded-xl shadow-2xl border ${theme.canvas.border}`}>
                <div className="text-center">
                    <img src="/yugen_logo_ui.png" alt="YUGENHUB" className="w-24 h-24 mx-auto mb-4 rounded-xl shadow-lg border border-white/10" />
                    <p className={theme.text.secondary}>Internal Management System</p>
                </div>

                <div className="flex flex-col items-center space-y-4 pt-8">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme={theme.mode === 'light' ? 'outline' : 'filled_black'}
                        shape="pill"
                    />
                    <p className={`text-xs ${theme.text.secondary} mt-4`}>
                        Invite Only. Authorized Personnel.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

