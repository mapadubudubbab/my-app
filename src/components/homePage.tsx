import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
    message: string;
    accessToken?: string;
    nickname?: string; 
}

export default function HomePage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('http://localhost:4000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data: LoginResponse = await response.json();
            console.log('data:', data);
            if (response.ok) {
                localStorage.setItem('accessToken', data.accessToken!);
                localStorage.setItem('userNickname', data.nickname!); 
                navigate('/main');
            } else {
                throw new Error(data.message || 'An error occurred');
            }
        } catch (error: any) {
            setError(error.message);
            console.error('Login error:', error);
        }
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'email') setEmail(value);
        if (name === 'password') setPassword(value);
    };

    return (
        <div>
            <h1>Home</h1>
            <form onSubmit={handleLogin}>
                <input type="email" name="email" placeholder="Email" value={email} onChange={onChange} required />
                <input type="password" name="password" placeholder="Password" value={password} onChange={onChange} required />
                <button type="submit">Login</button>
            </form>
            {error && <p>{error}</p>}
            <button onClick={() => navigate('/signup')}>Sign Up</button>
            <button onClick={() => navigate('/email-check')}>Forgot Password</button>
        </div>
    );
}
