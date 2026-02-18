import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

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
            alert(`Login Failed: ${result.error}`);
        }
    };

    const handleError = () => {
        console.log('Login Failed');
        alert("Google Login failed to initialize.");
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen ${theme.canvas.bg} ${theme.text.primary} p-4`}>
            <div className={`w-full max-w-md p-8 space-y-8 ${theme.canvas.card} rounded-xl shadow-2xl border ${theme.canvas.border}`}>
                <div className="text-center">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 tracking-tighter mb-2">YUGENHUB</h1>
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

