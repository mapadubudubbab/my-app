import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EmailCheckPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');

    const onVerify = async () => {
        try {
            const response = await fetch('http://localhost:4000/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, nickname }),
            });
            if (!response.ok) {
                throw new Error('Verification failed');
            }
            navigate('/reset-password', { state: { email, nickname } });
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
        }
    };

    const onCancel = () => {
        navigate('/');
    };

    return (
        <div>
            <h1>Email Check Page</h1>
            <form onSubmit={(e) => e.preventDefault()}>
                <label>
                    Email :
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <br />
                <label>
                    Nickname :
                    <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </label>
                <br />
                <button onClick={onVerify}>Verify</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </form>
            {error && <div>{error}</div>}
        </div>
    );
}
