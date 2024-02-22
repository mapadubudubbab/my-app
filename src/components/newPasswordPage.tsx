import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface LocationState {
    email: string;
    nickname: string;
}

const NewPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const state = location.state as LocationState | undefined;
    const { email, nickname } = state || {};
    console.log(email, nickname);
    const onChangeNewPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(e.target.value);
    };

    const onChangeConfirmPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("The passwords don't match.");
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, newPassword }),
            });

            if (!response.ok) {
                throw new Error('Password reset failed');
            }

            alert('Your password has been successfully reset.');
            navigate('/');
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div>
            <h1>New Password Page</h1>
            <form onSubmit={onSubmit}>
                <label>
                    New Password:
                    <input type="password" value={newPassword} onChange={onChangeNewPassword} required />
                </label>
                <br />
                <label>
                    Confirm New Password:
                    <input type="password" value={confirmPassword} onChange={onChangeConfirmPassword} required />
                </label>
                <br />
                <button type="submit">Reset Password</button>
            </form>
            {error && <div>{error}</div>}
        </div>
    );
};

export default NewPasswordPage;
