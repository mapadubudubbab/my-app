import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadPage: React.FC = () => {
    const [title, setTitle] = useState<string>('');
    const [text, setText] = useState<string>('');
    const [image, setImage] = useState<File | null>(null);
    const navigate = useNavigate();

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value);
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const accessToken = localStorage.getItem('accessToken');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('text', text);
        if (image) formData.append('image', image);

        try {
            const response = await fetch('http://localhost:4000/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData,
            });
            console.log('response:', response);
            if (!response.ok) throw new Error('Upload failed');

            navigate('/main');
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    return (
        <div>
            <h1>Upload Page</h1>
            <form onSubmit={handleSubmit}>
                Title:
                <input type="text" value={title} onChange={handleTitleChange} placeholder="Title" required /> <br />
                Contents:
                <textarea value={text} onChange={handleTextChange} placeholder="Text" required /><br />
                Image:
                <input type="file" onChange={handleImageChange} accept="image/*" /><br />
                <button type="submit">Upload</button>
            </form>
        </div>
    );
};

export default UploadPage;
