import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { useEffect } from 'react'; 

const Login = () => {
    const { loginWithGoogle, isAuthenticated } = useAuth();
    const navigate = useNavigate();

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-red-500 tracking-tighter mb-2">YUGENHUB</h1>
                    <p className="text-zinc-400">Internal Management System</p>
                </div>

                <div className="flex flex-col items-center space-y-4 pt-8">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_black"
                        shape="pill"
                    />
                    <p className="text-xs text-zinc-500 mt-4">
                        Invite Only. Authorized Personnel.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
