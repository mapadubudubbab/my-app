import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isEmailDuplicate, setIsEmailDuplicate] = useState(false);
    const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);

    const onClick = async (): Promise<void> => {
        try {
            const response = await fetch('http://localhost:4000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, nickname }),
            });
            if (!response.ok) {
                throw new Error('Signup failed');
            }
            const data = await response.json();
            console.log('Signup successful:', data);
            navigate('/');
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
                console.error('Signup error:', error);
            }
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log(value);

        if (name === 'email') {
            setEmail(value);
            checkDuplicate('email', value);
        } else if (name === 'password') {
            setPassword(value);
        } else if (name === 'nickname') {
            setNickname(value);
            checkDuplicate('nickname', value);
        }
    };

    const checkDuplicate = async (type: string, value: string): Promise<void> => {
        try {
            const response = await fetch(`http://localhost:4000/check-duplicate?type=${type}&value=${value}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error checking duplicate');
            }

            if (data.isDuplicate) {
                setError(`${type} is already in use.`);
                if (type === 'email') {
                    setIsEmailDuplicate(true);
                } else if (type === 'nickname') {
                    setIsNicknameDuplicate(true);
                }
            } else {
                setError('');
                if (type === 'email') {
                    setIsEmailDuplicate(false);
                } else if (type === 'nickname') {
                    setIsNicknameDuplicate(false);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!isEmailDuplicate && !isNicknameDuplicate) {
            onClick();
        }
    };

    const onCancel = (): void => {
        navigate('/');
    };

    return (
        <div>
            <h1>SignUp</h1>
            <form onSubmit={onSubmit}>
                Email :
                <input type="email" name="email" value={email} onChange={onChange} required />
                <br />
                Password :
                <input type="password" name="password" value={password} onChange={onChange} required />
                <br />
                Nickname :
                <input type="text" name="nickname" value={nickname} onChange={onChange} required />
                <br />

                <button type="submit" disabled={isEmailDuplicate || isNicknameDuplicate}>確認</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </form>
            {error && <div>{error}</div>}
        </div>
    )
}