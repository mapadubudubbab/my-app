import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Post {
    title: string;
    content: string;
}

const EditPage: React.FC = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<Post>({ title: '', content: '' }); // Post 타입 사용

    useEffect(() => {
        fetchPost();
    }, [postId]);

    const fetchPost = async () => {
        try {
            const response = await fetch(`http://localhost:4000/posts/${postId}`);
            if (!response.ok) throw new Error('Failed to fetch post');
            const data = await response.json();
            setPost({ title: data.post_title, content: data.post_text });
        } catch (error) {
            console.error('Fetch post error:', error);
            navigate('/');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPost(prevPost => ({ ...prevPost, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:4000/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({ title: post.title, text: post.content }),
            });
            if (!response.ok) throw new Error('Failed to edit post');
            alert('Successfully edited post.');
            navigate(`/post/${postId}`);
        } catch (error) {
            console.error('Edit post error:', error);
            alert('Failed to edit post.');
        }
    };

    return (
        <div>
            <h1>Edit Page</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title: </label>
                    <input type="text" name="title" value={post.title} onChange={handleChange} required />
                </div>
                <div>
                    <label>Contents: </label>
                    <textarea name="content" value={post.content} onChange={handleChange} required />
                </div>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default EditPage;
